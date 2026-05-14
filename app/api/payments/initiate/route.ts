import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { getRequestUser, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    const body = await req.json().catch(() => ({})) as {
      orderId?: string
      method?: string
      returnUrl?: string
      cancelUrl?: string
      guestEmail?: string
    }

    const orderId = body.orderId
    if (!orderId) return apiError('orderId is required', 400)

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) return apiError('Order not found', 404)

    if (user) {
      if (order.userId !== user.sub) return apiError('Forbidden', 403)
    } else {
      if (!order.guestEmail || !body.guestEmail) return apiError('Guest email is required', 400)
      if (order.guestEmail.toLowerCase() !== body.guestEmail.trim().toLowerCase()) return apiError('Forbidden', 403)
    }

    if (order.paymentStatus === 'paid') return apiError('Order already paid', 400)

    const method = body.method ?? 'card'
    if (method === 'crypto') {
      return apiOk(toPaymentIntent(order))
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey || secretKey.includes('replace') || secretKey.includes('placeholder')) {
      return apiError('Paystack is not configured. Set PAYSTACK_SECRET_KEY in env.', 503)
    }

    const payerEmail = user?.email ?? body.guestEmail?.trim().toLowerCase()
    if (!payerEmail) return apiError('Unable to determine payer email.', 400)

    const [reservedOrder] = await db.update(orders)
      .set({ paymentMethod: 'paystack', paymentStatus: 'pending', updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, 'unpaid')))
      .returning({ id: orders.id, total: orders.total, reference: orders.reference })

    if (!reservedOrder) {
      const [latest] = await db.select({ paymentStatus: orders.paymentStatus })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)
      if (latest?.paymentStatus === 'paid') return apiError('Order already paid', 400)
      if (latest?.paymentStatus === 'pending') return apiError('Payment already initialized. Please complete the existing payment.', 400)
      return apiError('Order is not ready for Paystack payment.', 409)
    }

    const amountKobo = Math.round(Number(reservedOrder.total) * 100)
    const reference = reservedOrder.reference

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payerEmail,
        amount: amountKobo,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/verify?reference=${reference}&orderId=${orderId}`,
        metadata: {
          orderId,
          userId: user?.sub ?? 'guest',
          custom_fields: [
            { display_name: 'Order Reference', variable_name: 'order_ref', value: reference },
          ],
        },
      }),
    })

    if (!paystackRes.ok) {
      await releasePaystackReservation(orderId)
      const err = await paystackRes.json().catch(() => ({}))
      return apiError((err as any).message ?? 'Paystack initialization failed', 502)
    }

    const data = await paystackRes.json() as { status: boolean; data: { authorization_url: string; reference: string; access_code: string } }
    if (!data.status) {
      await releasePaystackReservation(orderId)
      return apiError('Paystack returned unsuccessful status', 502)
    }

    const intent = toPaymentIntent({ ...order, paymentMethod: 'paystack', paymentStatus: 'pending' }, data.data.authorization_url)
    return apiOk(intent)
  } catch (err) {
    console.error('[payments/initiate]', err)
    return apiError('Failed to initiate payment', 500)
  }
}

async function releasePaystackReservation(orderId: string) {
  await db.update(orders)
    .set({ paymentMethod: null, paymentStatus: 'unpaid', updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.paymentMethod, 'paystack'), eq(orders.paymentStatus, 'pending')))
}
