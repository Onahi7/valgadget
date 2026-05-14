import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { wishlists } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq } from 'drizzle-orm'

export async function DELETE(req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { productId } = await context.params
  if (!productId) return apiError('productId is required', 400)

  await db.delete(wishlists)
    .where(and(eq(wishlists.userId, auth.user.sub), eq(wishlists.productId, productId)))

  return apiOk({ message: 'Wishlist item removed.' })
}
