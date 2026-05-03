/**
 * Payment webhook/confirmation endpoint.
 * Verifies Paystack webhook signature using HMAC-SHA512.
 * Supports Paystack and Flutterwave patterns.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { sendOrderConfirmationEmail } from '@/lib/server/email'
import { eq, and, sql } from 'drizzle-orm'
import crypto from 'crypto'

/** Verify Paystack webhook signature (HMAC-SHA512) */
function verifyPaystackSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/** Idempotent payment confirmation — atomic UPDATE WHERE not already paid, sends email on first confirmation */
async function confirmPayment(reference: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  // Atomic: only updates if paymentStatus is NOT 'paid' — prevents race condition
  const [updated] = await db.update(orders)
    .set({ paymentStatus: 'paid', status: 'confirmed', paymentRef: reference, updatedAt: new Date() })
    .where(and(eq(orders.reference, reference), sql`${orders.paymentStatus} != 'paid'`))
    .returning({ id: orders.id, userId: orders.userId, reference: orders.reference, total: orders.total })

  if (!updated) {
    // Either order not found, or already paid (idempotent)
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
        .catch(err => console.error('[webhook email]', err))
    }
  }

  return { ok: true, alreadyPaid: false }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // ── Paystack webhook ───────────────────────────────────────────────────
    // Signature is mandatory — reject if missing or invalid
    if (!signature || !verifyPaystackSignature(rawBody, signature)) {
      return apiError('Invalid or missing signature', 401)
    }

    const body = JSON.parse(rawBody)

    if (body.event === 'charge.success') {
      const ref = body.data?.reference as string | undefined
      const paidAmount = body.data?.amount as number | undefined  // in kobo
      if (!ref) return apiError('Missing reference', 400)

      // Verify amount matches order total (prevent paying ₦100 for a ₦50K order)
      const [order] = await db.select({ id: orders.id, total: orders.total, paymentStatus: orders.paymentStatus })
        .from(orders).where(eq(orders.reference, ref)).limit(1)
      if (!order) return apiError('Order not found for reference.', 404)
      if (order.paymentStatus === 'paid') return apiOk({ message: 'Already processed.' })

      const expectedKobo = Math.round(Number(order.total) * 100)
      if (paidAmount && paidAmount !== expectedKobo) {
        console.error(`[webhook] Amount mismatch: paid ${paidAmount} kobo, expected ${expectedKobo} kobo for order ${ref}`)
        return apiError('Amount mismatch', 400)
      }

      const result = await confirmPayment(ref)
      if (!result.ok) return apiError('Order not found for reference.', 404)
      return apiOk({ message: result.alreadyPaid ? 'Already processed.' : 'Payment confirmed.' })
    }

    // ── Flutterwave webhook ────────────────────────────────────────────────
    if (body.event === 'charge.completed' && body.data?.status === 'successful') {
      const ref = body.data?.tx_ref as string | undefined
      if (!ref) return apiError('Missing tx_ref', 400)

      const result = await confirmPayment(ref)
      if (!result.ok) return apiError('Order not found for reference.', 404)
      return apiOk({ message: result.alreadyPaid ? 'Already processed.' : 'Payment confirmed.' })
    }

    return apiOk({ message: 'Event received.' })
  } catch (err) {
    console.error('[payment webhook]', err)
    return apiError('Webhook processing failed.', 500)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('reference') ?? searchParams.get('tx_ref')

  if (!ref) return apiError('reference is required.', 400)

  const [order] = await db.select({
    id: orders.id, reference: orders.reference, status: orders.status,
    paymentStatus: orders.paymentStatus, total: orders.total,
  }).from(orders).where(eq(orders.reference, ref)).limit(1)

  if (!order) return apiError('Order not found.', 404)
  return apiOk({ ...order, total: Number(order.total) })
}
