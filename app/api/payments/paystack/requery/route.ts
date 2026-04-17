/**
 * POST /api/payments/paystack/requery
 * Customer-initiated re-verification of a Paystack payment.
 * Called when the redirect timed out but the user actually paid.
 * Body: { orderId }
 * Returns: { paymentStatus, status }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { sendOrderConfirmationEmail } from '@/lib/server/email'
import { eq, and, sql } from 'drizzle-orm'

async function confirmPayment(reference: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  // Atomic: only updates if paymentStatus is NOT 'paid'
  const [updated] = await db.update(orders)
    .set({ paymentStatus: 'paid', status: 'confirmed', paymentRef: reference, updatedAt: new Date() })
    .where(and(eq(orders.reference, reference), sql`${orders.paymentStatus} != 'paid'`))
    .returning({ id: orders.id, userId: orders.userId, reference: orders.reference, total: orders.total })

  if (!updated) {
    const [exists] = await db.select({ id: orders.id })
      .from(orders).where(eq(orders.reference, reference)).limit(1)
    return { ok: !!exists, alreadyPaid: !!exists }
  }

  // Send confirmation email on first payment
  if (updated.userId) {
    const [user] = await db.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, updated.userId)).limit(1)
    if (user) {
      sendOrderConfirmationEmail(user.email, user.name, updated.reference, `₦${Number(updated.total).toLocaleString()}`)
        .catch(err => console.error('[requery email]', err))
    }
  }

  return { ok: true, alreadyPaid: false }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth

    const { orderId } = await req.json() as { orderId: string }
    if (!orderId) return apiError('orderId is required', 400)

    const [order] = await db.select({
      id: orders.id, reference: orders.reference, total: orders.total,
      paymentStatus: orders.paymentStatus, paymentMethod: orders.paymentMethod,
      status: orders.status, userId: orders.userId,
    }).from(orders).where(eq(orders.id, orderId)).limit(1)

    if (!order) return apiError('Order not found', 404)
    if (order.userId !== auth.user.sub) return apiError('Forbidden', 403)
    if (order.paymentStatus === 'paid') return apiOk({ paymentStatus: 'paid', status: order.status })
    if (order.paymentMethod !== 'paystack') return apiError('Requery only supported for Paystack payments', 400)

    // Re-verify with Paystack
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return apiError('Paystack not configured', 503)

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(order.reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    )

    if (!verifyRes.ok) {
      // Paystack API error — payment likely not completed yet
      return apiOk({ paymentStatus: order.paymentStatus, status: order.status, message: 'Payment not yet completed on Paystack.' })
    }

    const data = await verifyRes.json() as { status: boolean; data: { status: string; reference: string; amount: number } }

    if (data.status && data.data.status === 'success') {
      // Verify amount
      const expectedKobo = Math.round(Number(order.total) * 100)
      if (data.data.amount && data.data.amount !== expectedKobo) {
        console.error(`[requery] Amount mismatch for ${order.reference}: paid ${data.data.amount}, expected ${expectedKobo}`)
        return apiError('Amount mismatch — contact support', 400)
      }

      const result = await confirmPayment(order.reference)
      if (result.ok) {
        return apiOk({ paymentStatus: 'paid', status: 'confirmed', message: result.alreadyPaid ? 'Payment already confirmed.' : 'Payment confirmed successfully!' })
      }
      return apiError('Failed to confirm payment', 500)
    }

    // Payment exists on Paystack but not successful yet
    return apiOk({
      paymentStatus: order.paymentStatus,
      status: order.status,
      paystackStatus: data.data.status,
      message: `Paystack reports status: ${data.data.status}. Please try again shortly.`,
    })
  } catch (err) {
    console.error('[paystack/requery]', err)
    return apiError('Requery failed', 500)
  }
}
