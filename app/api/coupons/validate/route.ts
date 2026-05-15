import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { coupons } from '@/lib/server/schema'
import { apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'
import { eq, and, or, isNull, gt } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(getRateLimitKey(req), rateLimitPresets.coupon)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const { code, cartTotal } = await req.json()

    if (!code || typeof code !== 'string') {
      return apiError('Coupon code is required', 400)
    }

    if (!cartTotal || typeof cartTotal !== 'number') {
      return apiError('Cart total is required', 400)
    }

    // Find active coupon
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
      return apiError('Invalid or expired coupon code', 400)
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return apiError('This coupon has reached its usage limit', 400)
    }

    // Check minimum purchase
    if (coupon.minPurchase && cartTotal < Number(coupon.minPurchase)) {
      return apiError(
        `Minimum purchase of ₦${Number(coupon.minPurchase).toLocaleString()} required`,
        400
      )
    }

    // Calculate discount
    let discount = 0
    let discountType = coupon.type

    if (coupon.type === 'percentage') {
      discount = (cartTotal * Number(coupon.value)) / 100
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount))
      }
    } else if (coupon.type === 'fixed') {
      discount = Number(coupon.value)
      // Don't allow discount to exceed cart total
      discount = Math.min(discount, cartTotal)
    } else if (coupon.type === 'free_shipping') {
      // Shipping discount will be applied separately
      discount = 0
      discountType = 'free_shipping'
    }

    return apiOk({
      code: coupon.code,
      type: discountType,
      discount: Math.round(discount * 100) / 100, // Round to 2 decimals
      message: coupon.type === 'free_shipping' 
        ? 'Free shipping applied!' 
        : `Coupon applied! You save ₦${Math.round(discount).toLocaleString()}`,
    })
  } catch (err) {
    console.error('[validate coupon]', err)
    return apiError('Failed to validate coupon', 500)
  }
}
