import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { reviews } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  if (auth.user.role !== 'admin') {
    return apiError('Unauthorized', 403)
  }

  try {
    const { id } = await params
    const { isActive } = await req.json()

    const [review] = await db
      .update(reviews)
      .set({ isActive })
      .where(eq(reviews.id, id))
      .returning()

    if (!review) {
      return apiError('Review not found', 404)
    }

    return apiOk(review)
  } catch (err) {
    console.error('[update review]', err)
    return apiError('Failed to update review', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  if (auth.user.role !== 'admin') {
    return apiError('Unauthorized', 403)
  }

  try {
    const { id } = await params

    await db.delete(reviews).where(eq(reviews.id, id))

    return apiOk({ message: 'Review deleted successfully' })
  } catch (err) {
    console.error('[delete review]', err)
    return apiError('Failed to delete review', 500)
  }
}
