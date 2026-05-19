import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

// GET /api/admin/orders/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
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

// PATCH /api/admin/orders/[id] — update status / payment status
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const { status, paymentStatus, paymentRef, notes, trackingNumber } = await req.json()

    // Validate status values
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    const validPaymentStatuses = ['unpaid', 'pending', 'pending_verification', 'paid', 'failed', 'refunded']
    if (status && !validStatuses.includes(status)) return apiError('Invalid status', 400)
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) return apiError('Invalid paymentStatus', 400)

    const [updated] = await db.update(orders)
      .set({
        ...(status        !== undefined && { status }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(paymentRef    !== undefined && { paymentRef }),
        ...(notes         !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updated) return apiError('Order not found.', 404)
    return apiOk({ ...updated, total: Number(updated.total) })
  } catch (err) {
    console.error('[admin patch order]', err)
    return apiError('Failed to update order.', 500)
  }
}

