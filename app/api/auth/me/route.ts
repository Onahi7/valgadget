import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('status' in auth) return auth

  const [user] = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
    affiliateCode: users.affiliateCode, createdAt: users.createdAt, updatedAt: users.updatedAt,
  }).from(users).where(eq(users.id, auth.user.sub)).limit(1)

  if (!user) return apiError('User not found.', 404)
  return apiOk(user)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('status' in auth) return auth

  try {
    const { name, phone, avatar } = await request.json().catch(() => ({}))
    const [updated] = await db.update(users)
      .set({ name, phone, avatar, updatedAt: new Date() })
      .where(eq(users.id, auth.user.sub))
      .returning({
        id: users.id, name: users.name, email: users.email, role: users.role,
        avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
        createdAt: users.createdAt, updatedAt: users.updatedAt,
      })
    return apiOk(updated)
  } catch (err) {
    console.error('[me patch]', err)
    return apiError('Failed to update profile.', 500)
  }
}
