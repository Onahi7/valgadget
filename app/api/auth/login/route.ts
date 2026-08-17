import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, refreshTokens } from '@/lib/server/schema'
import { comparePassword, signToken, generateRefreshToken, getRefreshTokenCookieOptions, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, rateLimitPresets, getScopedRateLimitKey } from '@/lib/server/rate-limiter'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP
    const rl = rateLimit(getScopedRateLimitKey(request, 'login'), rateLimitPresets.auth)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const body = await request.json().catch(() => null)
    const { email, password } = body ?? {}
    if (!email || !password) return apiError('Email and password are required.')

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    if (!user) return apiError('Invalid email or password.', 401)

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) return apiError('Invalid email or password.', 401)

    // Issue short-lived access token
    const token = await signToken({ sub: user.id, email: user.email, role: user.role, name: user.name })

    // Issue refresh token (stored in DB, set as httpOnly cookie)
    const refresh = generateRefreshToken()
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
    })

    const userData = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatar: user.avatar, phone: user.phone, isVerified: user.isVerified,
      affiliateCode: user.affiliateCode,
      createdAt: user.createdAt, updatedAt: user.updatedAt,
    }

    const res = apiOk({ user: userData })
    // Set access token as httpOnly cookie
    res.cookies.set('vg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })
    // Set refresh token as httpOnly cookie
    res.cookies.set('vg_refresh', refresh.raw, getRefreshTokenCookieOptions())
    return res
  } catch (err) {
    console.error('[login]', err)
    return apiError('Login failed. Please try again.', 500)
  }
}
