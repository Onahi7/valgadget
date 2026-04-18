import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

// Alias for /api/auth/me PATCH — profile update
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('status' in auth) return auth

  try {
    const { name, email, phone, avatar } = await request.json().catch(() => ({}))
    
    // If email is being changed, check if it's already taken
    if (email && email.toLowerCase() !== auth.user.email.toLowerCase()) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1)
      
      if (existing.length > 0) {
        return apiError('This email address is already in use.', 409)
      }
    }
    
    const updateData: any = { name, phone, avatar, updatedAt: new Date() }
    
    // If email changed, reset verification status
    if (email && email.toLowerCase() !== auth.user.email.toLowerCase()) {
      updateData.email = email.toLowerCase()
      updateData.isVerified = false
      // Optionally generate new verification token here
    }
    
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, auth.user.sub))
      .returning({
        id: users.id, name: users.name, email: users.email, role: users.role,
        avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
        createdAt: users.createdAt, updatedAt: users.updatedAt,
      })
    return apiOk(updated)
  } catch (err) {
    console.error('[auth/profile patch]', err)
    return apiError('Failed to update profile.', 500)
  }
}
