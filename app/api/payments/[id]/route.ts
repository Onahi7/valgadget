import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, or } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await context.params

  const [order] = await db.select().from(orders)
    .where(or(eq(orders.id, id), eq(orders.reference, id)))
    .limit(1)

  if (!order) return apiError('Payment not found.', 404)
  if (order.userId && order.userId !== auth.user.sub) return apiError('Forbidden', 403)

  return apiOk(toPaymentIntent(order))
}
