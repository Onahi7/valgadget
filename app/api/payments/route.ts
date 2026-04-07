/**
 * Payment webhook/confirmation endpoint.
 * In production, verify the webhook signature from your payment provider.
 * Supports Paystack and Flutterwave patterns.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Paystack webhook ───────────────────────────────────────────────────
    // event: 'charge.success', data.reference, data.status
    if (body.event === 'charge.success') {
      const ref = body.data?.reference as string | undefined
      if (!ref) return apiError('Missing reference', 400)

      const [updated] = await db.update(orders)
        .set({ paymentStatus: 'paid', status: 'confirmed', paymentRef: ref, updatedAt: new Date() })
        .where(eq(orders.reference, ref))
        .returning({ id: orders.id })

      if (!updated) return apiError('Order not found for reference.', 404)
      return apiOk({ message: 'Payment confirmed.' })
    }

    // ── Flutterwave webhook ────────────────────────────────────────────────
    // event: 'charge.completed', data.tx_ref, data.status
    if (body.event === 'charge.completed' && body.data?.status === 'successful') {
      const ref = body.data?.tx_ref as string | undefined
      if (!ref) return apiError('Missing tx_ref', 400)

      await db.update(orders)
        .set({ paymentStatus: 'paid', status: 'confirmed', paymentRef: ref, updatedAt: new Date() })
        .where(eq(orders.reference, ref))

      return apiOk({ message: 'Payment confirmed.' })
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
