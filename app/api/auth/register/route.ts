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

    // Sanitize and validate name
    const sanitizedName = String(name).trim().replace(/[<>]/g, '')
    if (sanitizedName.length < 2) {
      return apiError('Name must be at least 2 characters.', 400)
    }
    if (sanitizedName.length > 200) {
      return apiError('Name is too long.', 400)
    }

    // Validate email format
    const emailStr = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return apiError('Please provide a valid email address.', 400)
    }
    if (emailStr.length > 255) {
      return apiError('Email is too long.', 400)
    }

    // Validate password strength
    if (typeof password !== 'string' || password.length < 8) {
      return apiError('Password must be at least 8 characters.', 400, { password: ['Minimum 8 characters'] })
    }
    if (password.length > 128) {
      return apiError('Password is too long.', 400)
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, emailStr)).limit(1)
    if (existing.length > 0) return apiError('An account with this email already exists.', 409)

    const passwordHash = await hashPassword(password)
    const verifyToken  = crypto.randomBytes(32).toString('hex')
    const safeRole     = ['customer', 'affiliate'].includes(role) ? role : 'customer'
    const aCode        = safeRole === 'affiliate'
      ? (affiliateCode ?? sanitizedName.toLowerCase().replace(/\s+/g, '') + crypto.randomInt(100, 999))
      : undefined

    const [user] = await db.insert(users).values({
      name: sanitizedName, email: emailStr, passwordHash,
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
