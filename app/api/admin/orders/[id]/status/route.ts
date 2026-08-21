import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { sendShippingUpdateForOrder } from '@/lib/server/order-email'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { status } = await req.json().catch(() => ({})) as { status?: string }

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!status || !validStatuses.includes(status)) return apiError('Invalid status value', 400)

  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing) return apiError('Order not found.', 404)
  if (existing.status === 'refunded') return apiError('Refunded orders cannot change fulfilment status.', 409)
  if (existing.status === status) return apiOk({ ...existing, total: Number(existing.total) })

  const [updated] = await db.update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  await logAdminActivity(auth.user.sub, 'updated', 'order status', id, `${updated.reference}: ${existing.status} → ${status}`)
  if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status)) {
    void sendShippingUpdateForOrder(id, status).catch(error => console.error('[shipping update email]', error))
  }
  return apiOk({ ...updated, total: Number(updated.total) })
}

