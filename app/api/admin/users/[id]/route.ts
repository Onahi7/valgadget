import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params

  const [user] = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
    affiliateCode: users.affiliateCode, createdAt: users.createdAt, updatedAt: users.updatedAt,
  }).from(users).where(eq(users.id, id)).limit(1)

  if (!user) return apiError('User not found', 404)

  return apiOk(user)
}
