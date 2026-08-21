/**
 * PATCH /api/shipping-rates/[id]  — admin update a rate
 * DELETE /api/shipping-rates/[id] — admin delete a rate
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { shippingRates } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if ('status' in auth) return auth

    const { id } = await ctx.params
    const body = await req.json()
    const { price, estimatedDays, isActive } = body as { price?: number; estimatedDays?: number; isActive?: boolean }

    if (price != null && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return apiError('Price must be zero or greater.', 422)
    }
    if (estimatedDays != null && (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1 || Number(estimatedDays) > 60)) {
      return apiError('Estimated delivery days must be between 1 and 60.', 422)
    }
    if (isActive != null && typeof isActive !== 'boolean') return apiError('isActive must be a boolean.', 422)

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (price != null) updates.price = String(Number(price))
    if (estimatedDays != null) updates.estimatedDays = Number(estimatedDays)
    if (isActive != null) updates.isActive = isActive

    const [updated] = await db.update(shippingRates).set(updates).where(eq(shippingRates.id, id)).returning()
    if (!updated) return apiError('Not found', 404)
    await logAdminActivity(auth.user.sub, 'updated', 'shipping rate', id, `${updated.state}: ₦${Number(updated.price).toLocaleString('en-NG')}, ${updated.isActive ? 'active' : 'disabled'}`)
    return apiOk(updated)
  } catch (err) {
    console.error('[shipping-rates PATCH]', err)
    return apiError('Failed', 500)
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if ('status' in auth) return auth

    const { id } = await ctx.params
    const [deleted] = await db.delete(shippingRates).where(eq(shippingRates.id, id)).returning({ id: shippingRates.id })
    if (!deleted) return apiError('Not found', 404)
    await logAdminActivity(auth.user.sub, 'deleted', 'shipping rate', id)
    return apiOk({ deleted: true })
  } catch {
    return apiError('Failed', 500)
  }
}
