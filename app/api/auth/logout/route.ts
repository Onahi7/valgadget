import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { refreshTokens } from '@/lib/server/schema'
import { apiOk, getRefreshTokenCookieOptions, hashRefreshToken } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  // Delete refresh token from DB if present
  const rawRefresh = req.cookies.get('vg_refresh')?.value
  if (rawRefresh) {
    try {
      const hash = hashRefreshToken(rawRefresh)
      await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hash))
    } catch {
      // Ignore errors during logout cleanup
    }
  }

  const res = apiOk({ message: 'Logged out.' })
  res.cookies.set('vg_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' })
  res.cookies.set('vg_refresh', '', { ...getRefreshTokenCookieOptions(), maxAge: 0 })
  return res
}
