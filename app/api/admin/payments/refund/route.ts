import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { orderId, reason } = await req.json().catch(() => ({})) as { orderId?: string; reason?: string }
  if (!orderId) return apiError('orderId is required', 400)

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return apiError('Order not found', 404)

  const notes = reason ? `${order.notes ?? ''}
Refund: ${reason}`.trim() : order.notes

  const [updated] = await db.update(orders)
    .set({ status: 'refunded', paymentStatus: 'refunded', notes, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning()

  if (!updated) return apiError('Order not found', 404)

  return apiOk(toPaymentIntent(updated))
}
