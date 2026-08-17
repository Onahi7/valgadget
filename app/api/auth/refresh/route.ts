import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { refreshTokens, users } from '@/lib/server/schema'
import { signToken, hashRefreshToken, getRefreshTokenCookieOptions, generateRefreshToken, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, gt, lt } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get('vg_refresh')?.value
    if (!rawToken) return apiError('Refresh token required.', 401)

    const tokenHash = hashRefreshToken(rawToken)
    const now = new Date()

    // Cleanup expired tokens (best-effort, non-blocking)
    db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now)).catch(() => {})

    // Find valid refresh token
    const [stored] = await db.select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
    })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, now)
      ))
      .limit(1)

    if (!stored) {
      // Invalid or expired — clear cookie
      const res = apiError('Invalid or expired refresh token.', 401)
      res.cookies.set('vg_refresh', '', { ...getRefreshTokenCookieOptions(), maxAge: 0 })
      res.cookies.set('vg_token', '', { ...getRefreshTokenCookieOptions(), maxAge: 0 })
      return res
    }

    // Get user
    const [user] = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
      affiliateCode: users.affiliateCode, createdAt: users.createdAt, updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1)

    if (!user) {
      const res = apiError('User not found.', 401)
      res.cookies.set('vg_refresh', '', { ...getRefreshTokenCookieOptions(), maxAge: 0 })
      res.cookies.set('vg_token', '', { ...getRefreshTokenCookieOptions(), maxAge: 0 })
      return res
    }

    // Rotate refresh token (invalidate old, issue new)
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id))

    const newRefresh = generateRefreshToken()
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newRefresh.hash,
      expiresAt: newRefresh.expiresAt,
    })

    // Issue new access token
    const accessToken = await signToken({ sub: user.id, email: user.email, role: user.role, name: user.name })

    const res = apiOk({ user })
    res.cookies.set('vg_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })
    res.cookies.set('vg_refresh', newRefresh.raw, getRefreshTokenCookieOptions())
    return res
  } catch (err) {
    console.error('[refresh]', err)
    return apiError('Token refresh failed.', 500)
  }
}
