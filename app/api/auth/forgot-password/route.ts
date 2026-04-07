import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { sendPasswordResetEmail } from '@/lib/server/email'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const { email } = body ?? {}
    if (!email) return apiError('Email is required.')

    const [user] = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.email, email.toLowerCase())).limit(1)

    // Always return success to prevent email enumeration
    if (user) {
      const token   = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000)
      await db.update(users).set({ resetToken: token, resetExpires: expires, updatedAt: new Date() })
        .where(eq(users.id, user.id))
      sendPasswordResetEmail(user.email, user.name, token).catch(console.error)
    }

    return apiOk({ message: 'If an account exists for this email, a reset link has been sent.' })
  } catch (err) {
    console.error('[forgot-password]', err)
    return apiError('Request failed. Please try again.', 500)
  }
}
