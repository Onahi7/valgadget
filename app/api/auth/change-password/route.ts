import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, hashPassword, comparePassword, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('status' in auth) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const currentPassword = body.currentPassword
    const newPassword = body.newPassword
    const confirm = body.confirmPassword ?? body.newPasswordConfirmation

    if (!currentPassword || !newPassword || !confirm)
      return apiError('All password fields are required.')
    if (newPassword !== confirm)
      return apiError('New passwords do not match.')
    if (newPassword.length < 8)
      return apiError('New password must be at least 8 characters.')

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, auth.user.sub))
      .limit(1)

    if (!user) return apiError('User not found.', 404)

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) return apiError('Current password is incorrect.', 401)

    const passwordHash = await hashPassword(newPassword)
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id))

    return apiOk({ message: 'Password changed successfully.' })
  } catch (err) {
    console.error('[change-password]', err)
    return apiError('Failed to change password.', 500)
  }
}
