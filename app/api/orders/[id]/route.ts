import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, sql } from 'drizzle-orm'
import type { OrderItem } from '@/lib/server/schema'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await context.params
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)

  if (!order) return apiError('Order not found.', 404)

  // Customers can only see their own orders
  if (auth.user.role !== 'admin' && order.userId !== auth.user.sub) {
    return apiError('Order not found.', 404)
  }

  return apiOk({
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    tax:      Number(order.tax),
    total:    Number(order.total),
  })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const body = await req.json()
    const { status, paymentStatus, paymentRef } = body

    const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']
    const validPaymentStatuses = ['unpaid', 'pending', 'pending_verification', 'paid', 'failed', 'refunded']
    if (status && !validStatuses.includes(status)) return apiError('Invalid status value', 400)
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) return apiError('Invalid paymentStatus value', 400)

    // If cancelling, restore stock first (idempotent — skip if already cancelled)
    if (status === 'cancelled') {
      const [order] = await db.select({ items: orders.items, status: orders.status })
        .from(orders).where(eq(orders.id, id)).limit(1)
      if (order && order.status !== 'cancelled') {
        const items = (order.items ?? []) as OrderItem[]
        for (const item of items) {
          await db.update(products)
            .set({ stock: sql`${products.stock} + ${item.qty}`, updatedAt: new Date() })
            .where(eq(products.id, item.productId))
        }
      }
    }

    const [updated] = await db.update(orders)
      .set({ status, paymentStatus, paymentRef, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()

    if (!updated) return apiError('Order not found.', 404)
    return apiOk({ ...updated, subtotal: Number(updated.subtotal), total: Number(updated.total) })
  } catch (err) {
    console.error('[order patch]', err)
    return apiError('Failed to update order.', 500)
  }
}
