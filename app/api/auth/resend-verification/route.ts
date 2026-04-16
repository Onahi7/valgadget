import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { sendVerificationEmail } from '@/lib/server/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))
    if (!email) return apiError('Email is required.')

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Always return success to avoid email enumeration
    if (user && !user.isVerified) {
      const token = crypto.randomBytes(32).toString('hex')
      await db.update(users).set({ verifyToken: token, updatedAt: new Date() }).where(eq(users.id, user.id))
      sendVerificationEmail(user.email, user.name, token).catch(console.error)
    }

    return apiOk({ message: 'If your account exists and is unverified, a new link has been sent.' })
  } catch (err) {
    console.error('[resend-verification]', err)
    return apiError('Request failed.', 500)
  }
}
