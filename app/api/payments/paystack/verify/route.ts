/**
 * GET /api/payments/paystack/verify?reference=xxx&orderId=xxx
 * Called by Paystack redirect after payment. Verifies transaction and redirects user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const orderId = searchParams.get('orderId')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!reference) {
    return NextResponse.redirect(`${appUrl}/checkout?error=missing_reference`)
  }

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY ?? ''
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })

    if (!verifyRes.ok) {
      return NextResponse.redirect(`${appUrl}/checkout?error=verify_failed`)
    }

    const data = await verifyRes.json() as { status: boolean; data: { status: string; reference: string } }

    if (data.status && data.data.status === 'success') {
      // Payment confirmed — update order
      await db.update(orders)
        .set({ paymentStatus: 'paid', status: 'confirmed', paymentRef: reference, updatedAt: new Date() })
        .where(eq(orders.reference, reference))

      const id = orderId ?? ''
      return NextResponse.redirect(`${appUrl}/account/orders/${id}?paid=1`)
    } else {
      return NextResponse.redirect(`${appUrl}/checkout?error=payment_failed`)
    }
  } catch (err) {
    console.error('[paystack/verify]', err)
    return NextResponse.redirect(`${appUrl}/checkout?error=server_error`)
  }
}
