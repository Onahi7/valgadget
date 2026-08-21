import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { logAdminActivity } from '@/lib/server/admin-activity'
import { sendRefundConfirmationForOrder } from '@/lib/server/order-email'

type PaystackRefundResponse = { status?: boolean; message?: string; data?: { id?: number; refund_reference?: string; status?: string } }

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const body = await req.json().catch(() => ({})) as { orderId?: string; reason?: string; manualConfirmed?: boolean }
  const orderId = body.orderId?.trim()
  const reason = body.reason?.trim()
  if (!orderId) return apiError('orderId is required', 400)
  if (!reason || reason.length < 5) return apiError('A refund reason of at least 5 characters is required.', 422)
  if (reason.length > 1_000) return apiError('Refund reason is too long.', 422)

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return apiError('Order not found', 404)
  if (order.paymentStatus === 'refunded') return apiError('This order has already been refunded.', 409)
  if (order.paymentStatus !== 'paid') return apiError('Only a paid order can be refunded.', 409)

  const amount = Number(order.total)
  let refundReference = `MANUAL-${Date.now()}`
  let providerStatus = 'completed'

  if (order.paymentMethod === 'paystack') {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return apiError('Paystack is not configured. No refund was recorded.', 503)
    const transaction = order.paymentRef || order.reference
    let response: Response
    try {
      response = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction, amount: Math.round(amount * 100), customer_note: reason, merchant_note: `Refunded by admin ${auth.user.email}` }),
      })
    } catch (error) {
      console.error('[paystack refund network error]', error)
      return apiError('Paystack could not be reached. No refund was recorded; try again.', 502)
    }
    const result = await response.json().catch(() => ({})) as PaystackRefundResponse
    if (!response.ok || result.status !== true) {
      console.error('[paystack refund rejected]', result)
      return apiError(result.message || 'Paystack rejected the refund. No refund was recorded.', 502)
    }
    refundReference = result.data?.refund_reference || String(result.data?.id || transaction)
    providerStatus = result.data?.status || 'pending'
  } else if (body.manualConfirmed !== true) {
    return apiError('Confirm that the manual refund has already been sent before recording it.', 422)
  }

  const now = new Date()
  const [updated] = await db.update(orders).set({
    status: 'refunded', paymentStatus: 'refunded', refundAmount: String(amount), refundReason: reason,
    refundReference, refundStatus: providerStatus, refundedAt: now, updatedAt: now,
  }).where(and(eq(orders.id, orderId), eq(orders.paymentStatus, 'paid'))).returning()

  if (!updated) return apiError('The order changed while the refund was being processed. Refresh and verify it before retrying.', 409)
  await logAdminActivity(auth.user.sub, 'refunded', 'order', orderId, `${updated.reference}: ₦${amount.toLocaleString()} (${providerStatus}) — ${reason}`)
  void sendRefundConfirmationForOrder(orderId, amount, reason, providerStatus).catch(error => console.error('[refund email]', error))

  return apiOk({ ...updated, subtotal: Number(updated.subtotal), discount: Number(updated.discount), shipping: Number(updated.shipping), tax: Number(updated.tax), total: Number(updated.total), refundAmount: Number(updated.refundAmount) })
}
