/**
 * GET  /api/shipping-rates  — public list of all active state rates
 * POST /api/shipping-rates  — admin create/update rate
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { shippingRates } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  const rates = await db
    .select()
    .from(shippingRates)
    .where(eq(shippingRates.isActive, true))
    .orderBy(asc(shippingRates.state))
  return apiOk(rates)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin'])
    if ('status' in auth) return auth

    const body = await req.json()
    const { state, price, estimatedDays } = body as { state: string; price: number; estimatedDays: number }
    if (!state || price == null) return apiError('state and price are required', 400)

    // Upsert by state name
    const existing = await db.select().from(shippingRates).where(eq(shippingRates.state, state)).limit(1)

    if (existing.length > 0) {
      const [updated] = await db.update(shippingRates)
        .set({ price: String(price), estimatedDays: estimatedDays ?? 3, updatedAt: new Date() })
        .where(eq(shippingRates.state, state))
        .returning()
      return apiOk(updated)
    }

    const [created] = await db.insert(shippingRates).values({
      id: crypto.randomUUID(),
      state,
      price: String(price),
      estimatedDays: estimatedDays ?? 3,
    }).returning()
    return apiOk(created)
  } catch (err) {
    console.error('[shipping-rates POST]', err)
    return apiError('Failed', 500)
  }
}
