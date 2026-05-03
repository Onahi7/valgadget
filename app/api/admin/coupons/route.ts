import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { coupons } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))

    return apiOk(allCoupons.map(c => ({
      ...c,
      value: Number(c.value),
      minPurchase: c.minPurchase ? Number(c.minPurchase) : undefined,
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : undefined,
    })))
  } catch (err) {
    console.error('[get coupons]', err)
    return apiError('Failed to fetch coupons', 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { code, type, value, minPurchase, maxDiscount, usageLimit, expiresAt } = body

    if (!code || !type) {
      return apiError('Code and type are required', 400)
    }

    if (type !== 'free_shipping' && (!value || value <= 0)) {
      return apiError('Value must be greater than 0', 400)
    }

    const [coupon] = await db.insert(coupons).values({
      code: code.toUpperCase(),
      type,
      value: type === 'free_shipping' ? '0' : String(value),
      minPurchase: minPurchase ? String(minPurchase) : null,
      maxDiscount: maxDiscount ? String(maxDiscount) : null,
      usageLimit: usageLimit || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }).returning()

    return apiOk({
      ...coupon,
      value: Number(coupon.value),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
    }, 201)
  } catch (err: any) {
    console.error('[create coupon]', err)
    if (err.code === '23505') { // Unique violation
      return apiError('Coupon code already exists', 400)
    }
    return apiError('Failed to create coupon', 500)
  }
}
