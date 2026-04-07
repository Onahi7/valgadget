import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { hashPassword, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const { token, password, passwordConfirmation } = body ?? {}

    if (!token || !password || !passwordConfirmation) return apiError('Token and passwords are required.')
    if (password !== passwordConfirmation) return apiError('Passwords do not match.')
    if (password.length < 8) return apiError('Password must be at least 8 characters.')

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.resetToken, token), gt(users.resetExpires, new Date())))
      .limit(1)

    if (!user) return apiError('Reset link is invalid or has expired.', 400)

    const passwordHash = await hashPassword(password)
    await db.update(users)
      .set({ passwordHash, resetToken: null, resetExpires: null, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return apiOk({ message: 'Password reset successfully. Please sign in.' })
  } catch (err) {
    console.error('[reset-password]', err)
    return apiError('Reset failed. Please try again.', 500)
  }
}
