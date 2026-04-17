/**
 * GET /api/payments/paystack/verify?reference=xxx&orderId=xxx
 * Called by Paystack redirect after payment. Verifies transaction and redirects user.
 * Uses idempotent confirmPayment — safe if webhook already processed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { sendOrderConfirmationEmail } from '@/lib/server/email'
import { eq, and, sql } from 'drizzle-orm'

async function confirmPayment(reference: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  // Atomic: only updates if paymentStatus is NOT 'paid' — prevents race with webhook
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
        .catch(err => console.error('[verify email]', err))
    }
  }

  return { ok: true, alreadyPaid: false }
}

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
      // Idempotent — safe even if webhook already marked as paid
      await confirmPayment(reference)

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
