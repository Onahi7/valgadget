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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const { name, role, phone, isVerified } = await req.json().catch(() => ({}))

    if (id === auth.user.sub && role && role !== 'admin')
      return apiError('You cannot change your own role.', 400)

    const validRoles = ['customer', 'admin', 'affiliate']
    if (role && !validRoles.includes(role)) return apiError('Invalid role.', 400)

    const [updated] = await db.update(users)
      .set({ name, role, phone, isVerified, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id, name: users.name, email: users.email, role: users.role,
        phone: users.phone, isVerified: users.isVerified, updatedAt: users.updatedAt,
      })

    if (!updated) return apiError('User not found.', 404)
    return apiOk(updated)
  } catch (err) {
    console.error('[admin/users/[id] patch]', err)
    return apiError('Failed to update user.', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  if (id === auth.user.sub) return apiError('You cannot delete your own account.', 400)

  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  if (!deleted) return apiError('User not found.', 404)
  return apiOk({ message: 'User deleted.' })
}
