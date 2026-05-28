import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(getRateLimitKey(request), rateLimitPresets.auth)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const { token } = await request.json().catch(() => ({}))
    if (!token) return apiError('Verification token is required.')

    const [user] = await db
      .select({ id: users.id, isVerified: users.isVerified, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.verifyToken, token))
      .limit(1)

    if (!user) return apiError('Invalid or expired verification link.', 400)
    if (user.isVerified) return apiOk({ message: 'Email already verified.' })

    // Expire tokens older than 24 hours
    const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24) {
      return apiError('This verification link has expired. Please request a new one.', 400)
    }

    await db
      .update(users)
      .set({ isVerified: true, verifyToken: null, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return apiOk({ message: 'Email verified successfully.' })
  } catch (err) {
    console.error('[verify-email]', err)
    return apiError('Verification failed.', 500)
  }
}
