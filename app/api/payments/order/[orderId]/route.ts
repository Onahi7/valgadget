import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { orderId } = await context.params

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return apiError('Payment not found.', 404)
  if (order.userId && order.userId !== auth.user.sub) return apiError('Forbidden', 403)

  return apiOk(toPaymentIntent(order))
}
