import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { coupons } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  if (auth.user.role !== 'admin') {
    return apiError('Unauthorized', 403)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { code, type, value, minPurchase, maxDiscount, usageLimit, expiresAt, isActive } = body

    const updateData: any = { updatedAt: new Date() }

    if (code) updateData.code = code.toUpperCase()
    if (type) updateData.type = type
    if (value !== undefined) updateData.value = String(value)
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? String(minPurchase) : null
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? String(maxDiscount) : null
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const [coupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning()

    if (!coupon) {
      return apiError('Coupon not found', 404)
    }
    await logAdminActivity(auth.user.sub, 'updated', 'coupon', id, coupon.code)

    return apiOk({
      ...coupon,
      value: Number(coupon.value),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
    })
  } catch (err: any) {
    console.error('[update coupon]', err)
    if (err.code === '23505') {
      return apiError('Coupon code already exists', 400)
    }
    return apiError('Failed to update coupon', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  if (auth.user.role !== 'admin') {
    return apiError('Unauthorized', 403)
  }

  try {
    const { id } = await params

    const [deleted] = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id, code: coupons.code })
    if (!deleted) return apiError('Coupon not found', 404)
    await logAdminActivity(auth.user.sub, 'deleted', 'coupon', id, deleted.code)

    return apiOk({ message: 'Coupon deleted successfully' })
  } catch (err) {
    console.error('[delete coupon]', err)
    return apiError('Failed to delete coupon', 500)
  }
}
