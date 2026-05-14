import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { coupons } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, or, isNull, gt } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json()

    if (!code || typeof code !== 'string') {
      return apiError('Coupon code is required', 400)
    }

    if (cartTotal === undefined || typeof cartTotal !== 'number') {
      return apiError('Cart total is required', 400)
    }

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.isActive, true),
          or(
            isNull(coupons.expiresAt),
            gt(coupons.expiresAt, new Date())
          )
        )
      )
      .limit(1)

    if (!coupon) {
      return apiOk({
        code: code.toUpperCase(),
        isValid: false,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        message: 'Invalid or expired coupon code',
      })
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return apiOk({
        code: coupon.code,
        isValid: false,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        message: 'This coupon has reached its usage limit',
      })
    }

    if (coupon.minPurchase && cartTotal < Number(coupon.minPurchase)) {
      return apiOk({
        code: coupon.code,
        isValid: false,
        discountType: coupon.type === 'percentage' ? 'percent' : 'fixed',
        discountValue: Number(coupon.value),
        discountAmount: 0,
        minOrderAmount: Number(coupon.minPurchase),
        message: `Minimum purchase of ₦${Number(coupon.minPurchase).toLocaleString()} required`,
      })
    }

    let discountAmount = 0
    let discountType: 'fixed' | 'percent' = 'fixed'

    if (coupon.type === 'percentage') {
      discountType = 'percent'
      discountAmount = (cartTotal * Number(coupon.value)) / 100
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount))
      }
    } else if (coupon.type === 'fixed') {
      discountType = 'fixed'
      discountAmount = Number(coupon.value)
      discountAmount = Math.min(discountAmount, cartTotal)
    } else if (coupon.type === 'free_shipping') {
      discountType = 'fixed'
      discountAmount = 0
    }

    return apiOk({
      code: coupon.code,
      isValid: true,
      discountType,
      discountValue: Number(coupon.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
      minOrderAmount: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      message: coupon.type === 'free_shipping'
        ? 'Free shipping applied!'
        : `Coupon applied! You save ₦${Math.round(discountAmount).toLocaleString()}`,
    })
  } catch (err) {
    console.error('[payments coupons validate]', err)
    return apiError('Failed to validate coupon', 500)
  }
}
