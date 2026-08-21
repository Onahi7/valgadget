import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { verifyGuestOrderAccessToken } from '@/lib/server/guest-order-access'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch order - no auth required for guest orders
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    if (!order) {
      return apiError('Order not found', 404)
    }

    // Only allow access to guest orders (orders without userId)
    // For logged-in user orders, they should use the authenticated endpoint
    if (order.userId) {
      return apiError('This order requires authentication to view', 403)
    }
    const token = new URL(req.url).searchParams.get('token') ?? ''
    if (!order.guestEmail || !verifyGuestOrderAccessToken(order.id, order.guestEmail, token)) {
      return apiError('A valid guest order access link is required.', 403)
    }

    return apiOk({
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      refundAmount: order.refundAmount === null ? null : Number(order.refundAmount),
    })
  } catch (err) {
    console.error('[guest order view]', err)
    return apiError('Failed to load order', 500)
  }
}
