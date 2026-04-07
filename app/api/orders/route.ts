import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError, generateReference } from '@/lib/server/auth-helpers'
import { sendOrderConfirmationEmail } from '@/lib/server/email'
import { eq, desc, and, sql } from 'drizzle-orm'
import type { OrderItem, Address } from '@/lib/server/schema'
import { db as mainDb } from '@/lib/server/db'
import { users } from '@/lib/server/schema'

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
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { items, shippingAddress, couponCode, affiliateCode, paymentMethod, notes } = body as {
      items: Array<{ productId: string; qty: number }>
      shippingAddress: Address
      couponCode?: string
      affiliateCode?: string
      paymentMethod?: string
      notes?: string
    }

    if (!items?.length) return apiError('Order must contain at least one item.')
    if (!shippingAddress) return apiError('Shipping address is required.')

    // Fetch products and build line items
    const productIds = items.map(i => i.productId)
    const found = await db.select({ id: products.id, name: products.name, sku: products.sku, price: products.price, stock: products.stock, images: products.images })
      .from(products).where(sql`id = any(${productIds})`)

    const orderItems: OrderItem[] = []
    let subtotal = 0

    for (const lineItem of items) {
      const p = found.find(f => f.id === lineItem.productId)
      if (!p) return apiError(`Product ${lineItem.productId} not found.`, 422)
      if (p.stock < lineItem.qty) return apiError(`Insufficient stock for ${p.name}.`, 422)

      const unitPrice = Number(p.price)
      orderItems.push({ productId: p.id, name: p.name, sku: p.sku, price: unitPrice, qty: lineItem.qty, image: (p.images as string[])[0] })
      subtotal += unitPrice * lineItem.qty
    }

    const shipping = subtotal >= 99 ? 0 : 9.99
    const tax      = subtotal * 0.08
    const total    = subtotal + shipping + tax

    const reference = generateReference()

    const [order] = await db.insert(orders).values({
      reference, userId: auth.user.sub, status: 'pending',
      paymentStatus: 'unpaid', paymentMethod, items: orderItems,
      subtotal: String(subtotal.toFixed(2)),
      discount: '0',
      shipping: String(shipping.toFixed(2)),
      tax: String(tax.toFixed(2)),
      total: String(total.toFixed(2)),
      couponCode, affiliateCode, shippingAddress, notes,
    }).returning()

    // Send confirmation email (fire-and-forget)
    const [user] = await mainDb.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, auth.user.sub)).limit(1)
    if (user) {
      sendOrderConfirmationEmail(user.email, user.name, reference, `$${total.toFixed(2)}`).catch(console.error)
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
