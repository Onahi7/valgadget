import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq, sql } from 'drizzle-orm'
import type { OrderItem } from '@/lib/server/schema'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await context.params

  try {
    const [order] = await db.select({ id: orders.id, status: orders.status, items: orders.items, userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    if (!order) return apiError('Order not found.', 404)
    if (order.userId !== auth.user.sub) return apiError('Forbidden', 403)
    if (order.status === 'cancelled') return apiError('Order already cancelled.', 400)
    if (order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
      return apiError('Cannot cancel a confirmed/shipped/delivered order. Please contact support.', 400)
    }

    const items = (order.items ?? []) as OrderItem[]
    for (const item of items) {
      await db.update(products)
        .set({ stock: sql`${products.stock} + ${item.qty}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId))
    }

    const [cancelled] = await db.update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, 'pending')))
      .returning({ id: orders.id })

    if (!cancelled) return apiError('Order could not be cancelled. It may have already been processed.', 409)

    return apiOk({ message: 'Order cancelled successfully.' })
  } catch (err) {
    console.error('[orders cancel]', err)
    return apiError('Failed to cancel order.', 500)
  }
}
