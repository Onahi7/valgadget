import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json().catch(() => ({}))
    if (!token) return apiError('Verification token is required.')

    const [user] = await db
      .select({ id: users.id, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.verifyToken, token))
      .limit(1)

    if (!user) return apiError('Invalid or expired verification link.', 400)
    if (user.isVerified) return apiOk({ message: 'Email already verified.' })

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
