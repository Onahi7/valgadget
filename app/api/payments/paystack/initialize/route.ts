/**
 * POST /api/payments/paystack/initialize
 * Initializes a Paystack transaction for an existing order.
 * Body: { orderId, email }
 * Returns: { authorization_url, reference, access_code }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth
    const body = await req.json()
    const { orderId } = body as { orderId: string }

    if (!orderId) return apiError('orderId is required', 400)

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) return apiError('Order not found', 404)
    if (order.userId !== auth.user.sub) return apiError('Forbidden', 403)

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey || secretKey.startsWith('sk_test_replace')) {
      return apiError('Paystack is not configured. Set PAYSTACK_SECRET_KEY in env.', 503)
    }

    const amountKobo = Math.round(Number(order.total) * 100) // Paystack uses kobo (100ths)
    const reference = order.reference

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: auth.user.email,
        amount: amountKobo,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/verify?reference=${reference}&orderId=${orderId}`,
        metadata: {
          orderId,
          userId: auth.user.sub,
          custom_fields: [
            { display_name: 'Order Reference', variable_name: 'order_ref', value: reference },
          ],
        },
      }),
    })

    if (!paystackRes.ok) {
      const err = await paystackRes.json().catch(() => ({}))
      return apiError((err as any).message ?? 'Paystack initialization failed', 502)
    }

    const data = await paystackRes.json() as { status: boolean; data: { authorization_url: string; reference: string; access_code: string } }
    if (!data.status) return apiError('Paystack returned unsuccessful status', 502)

    // Mark order as awaiting Paystack payment
    await db.update(orders)
      .set({ paymentMethod: 'paystack', paymentStatus: 'pending', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    return apiOk(data.data)
  } catch (err) {
    console.error('[paystack/initialize]', err)
    return apiError('Failed to initialize payment', 500)
  }
}
