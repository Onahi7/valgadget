import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { paymentStatus } = await req.json().catch(() => ({})) as { paymentStatus?: string }

  const validPaymentStatuses = ['unpaid', 'pending', 'pending_verification', 'paid', 'failed', 'refunded']
  if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
    return apiError('Invalid paymentStatus value', 400)
  }

  const [updated] = await db.update(orders)
    .set({ paymentStatus, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  return apiOk({ ...updated, total: Number(updated.total) })
}
