import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq, sql } from 'drizzle-orm'
import type { OrderItem } from '@/lib/server/schema'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { status } = await req.json().catch(() => ({})) as { status?: string }

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  if (!status || !validStatuses.includes(status)) return apiError('Invalid status value', 400)

  if (status === 'cancelled' || status === 'refunded') {
    const [order] = await db.select({ items: orders.items, status: orders.status })
      .from(orders).where(eq(orders.id, id)).limit(1)
    if (order && order.status !== status) {
      const items = (order.items ?? []) as OrderItem[]
      for (const item of items) {
        await db.update(products)
          .set({ stock: sql`${products.stock} + ${item.qty}`, updatedAt: new Date() })
          .where(eq(products.id, item.productId))
      }
    }
  }

  const [updated] = await db.update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  return apiOk({ ...updated, total: Number(updated.total) })
}
