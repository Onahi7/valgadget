import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products, shippingRates, users, affiliateClicks } from '@/lib/server/schema'
import { requireAuth, getRequestUser, apiOk, apiError, generateReference } from '@/lib/server/auth-helpers'
import { eq, desc, and, sql, or } from 'drizzle-orm'
import type { OrderItem, Address } from '@/lib/server/schema'
import { NeonDbError } from '@neondatabase/serverless'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10')))
  const status = searchParams.get('status') ?? undefined

  // Admins see all, customers see own only
  const isAdmin = auth.user.role === 'admin'

  const conditions = isAdmin
    ? status ? [eq(orders.status, status)] : []
    : status
      ? [eq(orders.userId, auth.user.sub), eq(orders.status, status)]
      : [eq(orders.userId, auth.user.sub)]

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(orders).where(where)

  const data = await db.select().from(orders).where(where)
    .orderBy(desc(orders.createdAt)).limit(limit).offset((page - 1) * limit)

  return apiOk({ data: data.map(numericOrder), total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

export async function POST(req: NextRequest) {
  // Make auth optional for guest checkout
  const user = await getRequestUser(req)

  try {
    const body = await req.json()
    const { items: rawItems, shippingAddress, couponCode, affiliateCode, paymentMethod, notes, guestEmail } = body as {
      items: Array<{ productId: string; quantity?: number; qty?: number }>
      shippingAddress: Address
      couponCode?: string
      affiliateCode?: string
      paymentMethod?: string
      notes?: string
      guestEmail?: string
    }
    // Normalise: frontend sends "quantity", internal schema uses "qty"
    const items = (rawItems ?? []).map(i => ({ productId: i.productId, qty: i.quantity ?? i.qty ?? 1 }))

    if (!items?.length) return apiError('Order must contain at least one item.')
    if (!shippingAddress) return apiError('Shipping address is required.')
    
    // Require email for guest orders
    if (!user && !guestEmail) {
      return apiError('Email is required for guest orders.', 400)
    }
    
    // Validate email format for guest orders
    if (!user && guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return apiError('Please provide a valid email address.', 400)
    }

    // Fetch products and build line items
    const productIds = items.map(i => i.productId)
    const found = await db.select({ id: products.id, name: products.name, sku: products.sku, price: products.price, stock: products.stock, images: products.images })
      .from(products).where(sql`id = any(${productIds})`)

    const orderItems: OrderItem[] = []
    let subtotal = 0

    for (const lineItem of items) {
      const p = found.find(f => f.id === lineItem.productId)
      if (!p) return apiError(`Product ${lineItem.productId} not found.`, 422)
      if (p.stock < lineItem.qty) return apiError(`Insufficient stock for ${p.name}. Only ${p.stock} left.`, 422)

      const unitPrice = Number(p.price)
      orderItems.push({ productId: p.id, name: p.name, sku: p.sku, price: unitPrice, qty: lineItem.qty, image: (p.images as string[])[0] })
      subtotal += unitPrice * lineItem.qty
    }

    // Look up shipping rate from DB based on state
    let shipping = 0
    const addrState = (shippingAddress as unknown as Record<string, unknown>)?.state as string | undefined
    if (addrState && addrState !== 'Other' && subtotal < 50000) {
      const [rate] = await db.select({ price: shippingRates.price })
        .from(shippingRates)
        .where(and(eq(shippingRates.state, addrState), eq(shippingRates.isActive, true)))
        .limit(1)
      shipping = rate ? Number(rate.price) : 2500
    } else if (addrState !== 'Other' && subtotal < 50000) {
      shipping = 2500 // fallback flat rate
    }
    const tax      = 0  // No VAT added (prices are tax-inclusive)
    const total    = subtotal + shipping + tax

    const reference = generateReference()

    const [order] = await db.insert(orders).values({
      reference, 
      userId: user?.sub || null, 
      guestEmail: user ? null : guestEmail,
      status: 'pending',
      paymentStatus: 'unpaid', 
      paymentMethod, 
      items: orderItems,
      subtotal: String(subtotal.toFixed(2)),
      discount: '0',
      shipping: String(shipping.toFixed(2)),
      tax: String(tax.toFixed(2)),
      total: String(total.toFixed(2)),
      couponCode, 
      affiliateCode, 
      shippingAddress, 
      notes,
    }).returning()

    // Atomic stock deduction — only succeeds if stock >= qty (prevents overselling)
    for (const item of orderItems) {
      const [updated] = await db.update(products)
        .set({ stock: sql`${products.stock} - ${item.qty}`, updatedAt: new Date() })
        .where(and(eq(products.id, item.productId), sql`${products.stock} >= ${item.qty}`))
        .returning({ id: products.id })

      if (!updated) {
        // Stock ran out between check and deduction — cancel this order and restore any already-deducted stock
        for (const prev of orderItems) {
          if (prev.productId === item.productId) break
          await db.update(products)
            .set({ stock: sql`${products.stock} + ${prev.qty}`, updatedAt: new Date() })
            .where(eq(products.id, prev.productId))
        }
        await db.update(orders).set({ status: 'cancelled', notes: 'Auto-cancelled: stock depleted during checkout' }).where(eq(orders.id, order.id))
        return apiError(`Insufficient stock for ${item.name}. Order cancelled.`, 409)
      }
    }

    // Credit affiliate commission if affiliate code was used
    if (affiliateCode) {
      const [affiliate] = await db.select({ id: users.id, affiliateCode: users.affiliateCode })
        .from(users).where(eq(users.affiliateCode, affiliateCode)).limit(1)
      if (affiliate) {
        const commissionRate = 0.05 // 5% commission
        const commission = Math.round(subtotal * commissionRate)
        // Credit affiliate balance
        await db.update(users)
          .set({ affiliateBalance: sql`${users.affiliateBalance} + ${commission}`, updatedAt: new Date() })
          .where(eq(users.id, affiliate.id))
        // Record the click/conversion
        await db.insert(affiliateClicks).values({
          code: affiliateCode, orderId: order.id, userId: user?.sub || null,
          commission: String(commission), convertedAt: new Date(),
        }).catch(() => {}) // ignore if duplicate
      }
    }

    return apiOk(numericOrder(order), 201)
  } catch (err) {
    console.error('[create order]', err)
    return apiError('Failed to create order. Please try again.', 500)
  }
}

function numericOrder(o: typeof orders.$inferSelect) {
  return {
    ...o,
    subtotal:  Number(o.subtotal),
    discount:  Number(o.discount),
    shipping:  Number(o.shipping),
    tax:       Number(o.tax),
    total:     Number(o.total),
  }
}
