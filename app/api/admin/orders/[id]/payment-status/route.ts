import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'
import { sendPaymentConfirmationForOrder } from '@/lib/server/order-email'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { paymentStatus, paymentRef, confirmed } = await req.json().catch(() => ({})) as { paymentStatus?: string; paymentRef?: string; confirmed?: boolean }

  const validPaymentStatuses = ['unpaid', 'pending', 'pending_verification', 'paid', 'failed']
  if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
    return apiError('Invalid paymentStatus value', 400)
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!existing) return apiError('Order not found.', 404)
  if (existing.paymentStatus === 'refunded') return apiError('Refunded payments cannot be edited.', 409)
  if (paymentStatus === 'paid' && existing.paymentStatus !== 'paid' && confirmed !== true) {
    return apiError('Explicit admin confirmation is required before marking a payment as paid.', 422)
  }

  const [updated] = await db.update(orders)
    .set({
      paymentStatus,
      ...(paymentRef !== undefined && { paymentRef: paymentRef.trim() || null }),
      ...(paymentStatus === 'paid' && existing.status === 'pending' && { status: 'confirmed' }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  await logAdminActivity(auth.user.sub, paymentStatus === 'paid' ? 'confirmed' : 'updated', 'order payment', id, `${updated.reference}: ${existing.paymentStatus} → ${paymentStatus}${updated.paymentRef ? ` (${updated.paymentRef})` : ''}`)
  if (paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
    void sendPaymentConfirmationForOrder(id).catch(error => console.error('[payment confirmation email]', error))
  }
  return apiOk({ ...updated, total: Number(updated.total) })
}
