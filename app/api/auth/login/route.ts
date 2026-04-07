import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { comparePassword, signToken, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const { email, password } = body ?? {}
    if (!email || !password) return apiError('Email and password are required.')

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    if (!user) return apiError('Invalid email or password.', 401)

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) return apiError('Invalid email or password.', 401)

    const token = await signToken({ sub: user.id, email: user.email, role: user.role, name: user.name })
    return apiOk({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, phone: user.phone, isVerified: user.isVerified,
        affiliateCode: user.affiliateCode,
        createdAt: user.createdAt, updatedAt: user.updatedAt,
      },
    })
  } catch (err) {
    console.error('[login]', err)
    return apiError('Login failed. Please try again.', 500)
  }
}
