import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { hashPassword, signToken, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { sendVerificationEmail } from '@/lib/server/email'
import { rateLimit, rateLimitPresets, getScopedRateLimitKey } from '@/lib/server/rate-limiter'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP
    const rl = rateLimit(getScopedRateLimitKey(req, 'register'), rateLimitPresets.register)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const body = await req.json().catch(() => null)
    const { name, email, password, role = 'customer', affiliateCode } = body ?? {}

    if (!name || !email || !password) {
      return apiError('Name, email and password are required.')
    }
    if (password.length < 8) {
      return apiError('Password must be at least 8 characters.', 400, { password: ['Minimum 8 characters'] })
    }
    if (name.length > 200) {
      return apiError('Name is too long.', 400)
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    if (existing.length > 0) return apiError('An account with this email already exists.', 409)

    const passwordHash = await hashPassword(password)
    const verifyToken  = crypto.randomBytes(32).toString('hex')
    const safeRole     = ['customer', 'affiliate'].includes(role) ? role : 'customer'
    const aCode        = safeRole === 'affiliate'
      ? (affiliateCode ?? (name as string).toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 999))
      : undefined

    const [user] = await db.insert(users).values({
      name, email: email.toLowerCase(), passwordHash,
      role: safeRole, isVerified: false, verifyToken, affiliateCode: aCode,
    }).returning({
      id: users.id, name: users.name, email: users.email, role: users.role,
      isVerified: users.isVerified, affiliateCode: users.affiliateCode,
      avatar: users.avatar, phone: users.phone,
      createdAt: users.createdAt, updatedAt: users.updatedAt,
    })

    sendVerificationEmail(user.email, user.name, verifyToken).catch(console.error)

    const token = await signToken({ sub: user.id, email: user.email, role: user.role, name: user.name })
    return apiOk({ token, user }, 201)
  } catch (err) {
    console.error('[register]', err)
    return apiError('Registration failed. Please try again.', 500)
  }
}
