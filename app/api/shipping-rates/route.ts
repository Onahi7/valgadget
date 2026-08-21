/**
 * GET  /api/shipping-rates  — public list of all active state rates
 * POST /api/shipping-rates  — admin create/update rate
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { shippingRates } from '@/lib/server/schema'
import { getRequestUser, requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, asc } from 'drizzle-orm'
import { NIGERIA_STATES } from '@/lib/data/nigeria-locations'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    const query = db.select().from(shippingRates)
    const rates = user?.role === 'admin'
      ? await query.orderBy(asc(shippingRates.state))
      : await query.where(eq(shippingRates.isActive, true)).orderBy(asc(shippingRates.state))
    return apiOk(rates)
  } catch (error) {
    console.error('[shipping-rates GET]', error)
    return apiError('Delivery rates are temporarily unavailable.', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if ('status' in auth) return auth

    const body = await req.json()
    const { state: rawState, price, estimatedDays } = body as { state: string; price: number; estimatedDays: number }
    const state = rawState?.trim()
    if (!state || price == null) return apiError('State and price are required.', 400)
    if (!NIGERIA_STATES.includes(state)) return apiError('Select a valid Nigerian state.', 422)
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return apiError('Price must be zero or greater.', 422)
    if (estimatedDays != null && (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1 || Number(estimatedDays) > 60)) {
      return apiError('Estimated delivery days must be between 1 and 60.', 422)
    }

    // Upsert by state name
    const existing = await db.select().from(shippingRates).where(eq(shippingRates.state, state)).limit(1)

    if (existing.length > 0) {
      const [updated] = await db.update(shippingRates)
        .set({ price: String(Number(price)), estimatedDays: Number(estimatedDays ?? 3), isActive: true, updatedAt: new Date() })
        .where(eq(shippingRates.state, state))
        .returning()
      await logAdminActivity(auth.user.sub, 'updated', 'shipping rate', updated.id, `${state}: ₦${Number(price).toLocaleString('en-NG')}`)
      return apiOk(updated)
    }

    const [created] = await db.insert(shippingRates).values({
      id: crypto.randomUUID(),
      state,
      price: String(Number(price)),
      estimatedDays: Number(estimatedDays ?? 3),
    }).returning()
    await logAdminActivity(auth.user.sub, 'created', 'shipping rate', created.id, `${state}: ₦${Number(price).toLocaleString('en-NG')}`)
    return apiOk(created)
  } catch (err) {
    console.error('[shipping-rates POST]', err)
    return apiError('Failed', 500)
  }
}
