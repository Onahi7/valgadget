import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await params

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, auth.user.sub)))
    .limit(1)

  if (!order) return apiError('Order not found.', 404)
  return apiOk({
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    tax:      Number(order.tax),
    total:    Number(order.total),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await params

  try {
    const [order] = await db
      .select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus, items: orders.items })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, auth.user.sub)))
      .limit(1)

    if (!order) return apiError('Order not found.', 404)
    if (order.status === 'cancelled') return apiError('Order already cancelled.', 400)
    if (order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
      return apiError('Cannot cancel a confirmed/shipped/delivered order. Please contact support.', 400)
    }

    // Atomic update — only cancels if status is still pending (prevents race with admin cancel)
    const [cancelled] = await db.update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, 'pending')))
      .returning({ id: orders.id })

    if (!cancelled) return apiError('Order could not be cancelled. It may have already been processed.', 409)

    return apiOk({ message: 'Order cancelled successfully.' })
  } catch (err) {
    console.error('[customer cancel]', err)
    return apiError('Failed to cancel order.', 500)
  }
}

