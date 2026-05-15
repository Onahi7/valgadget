import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { orderId, reason, transactionId } = await req.json().catch(() => ({})) as { orderId?: string; reason?: string; transactionId?: string }
  if (!orderId) return apiError('orderId is required', 400)

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return apiError('Order not found', 404)
  if (order.paymentStatus !== 'paid') return apiError('Can only refund paid orders', 400)

  // If Paystack payment, attempt refund via Paystack API
  if (order.paymentMethod === 'paystack' && order.paymentRef) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return apiError('Paystack is not configured', 503)

    try {
      // Find the transaction ID to refund
      const txId = transactionId ?? order.paymentRef
      const paystackRes = await fetch(`https://api.paystack.co/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: txId,
          amount: Math.round(Number(order.total) * 100), // in kobo
        }),
      })

      if (!paystackRes.ok) {
        const errData = await paystackRes.json().catch(() => ({})) as { message?: string }
        console.error('[paystack refund failed]', errData)
        // Continue with DB update even if Paystack refund fails (manual refund may be needed)
      }
    } catch (err) {
      console.error('[paystack refund error]', err)
      // Continue with DB update — admin can process refund manually
    }
  }

  const notes = reason ? `${order.notes ?? ''}\nRefund: ${reason}`.trim() : order.notes

  const [updated] = await db.update(orders)
    .set({ status: 'refunded', paymentStatus: 'refunded', notes, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning()

  if (!updated) return apiError('Order not found', 404)

  return apiOk(toPaymentIntent(updated))
}
