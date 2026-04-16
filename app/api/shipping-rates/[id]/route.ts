/**
 * PATCH /api/shipping-rates/[id]  — admin update a rate
 * DELETE /api/shipping-rates/[id] — admin delete a rate
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { shippingRates } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if ('status' in auth) return auth

    const { id } = await ctx.params
    const body = await req.json()
    const { price, estimatedDays, isActive } = body as { price?: number; estimatedDays?: number; isActive?: boolean }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (price != null) updates.price = String(price)
    if (estimatedDays != null) updates.estimatedDays = estimatedDays
    if (isActive != null) updates.isActive = isActive

    const [updated] = await db.update(shippingRates).set(updates).where(eq(shippingRates.id, id)).returning()
    if (!updated) return apiError('Not found', 404)
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
    await db.delete(shippingRates).where(eq(shippingRates.id, id))
    return apiOk({ deleted: true })
  } catch (err) {
    return apiError('Failed', 500)
  }
}
