import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'
import { sendShippingUpdateForOrder } from '@/lib/server/order-email'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { trackingNumber, trackingUrl, notifyCustomer } = await req.json().catch(() => ({})) as { trackingNumber?: string; trackingUrl?: string; notifyCustomer?: boolean }

  const number = trackingNumber?.trim()
  const url = trackingUrl?.trim()
  if (!number) return apiError('trackingNumber is required', 400)
  if (number.length > 200) return apiError('Tracking number is too long.', 422)
  if (url && (!/^https?:\/\//i.test(url) || url.length > 2_000)) return apiError('Enter a valid tracking URL.', 422)

  const [updated] = await db.update(orders)
    .set({ trackingNumber: number, trackingUrl: url || null, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  await logAdminActivity(auth.user.sub, 'updated', 'order tracking', id, `${updated.reference}: ${number}${notifyCustomer ? ' (customer notified)' : ''}`)
  if (notifyCustomer) {
    void sendShippingUpdateForOrder(id, updated.status === 'delivered' ? 'delivered' : 'shipped').catch(error => console.error('[tracking email]', error))
  }
  return apiOk({ ...updated, total: Number(updated.total) })
}
