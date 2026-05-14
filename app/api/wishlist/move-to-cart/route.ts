import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { wishlists } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { productId } = await req.json().catch(() => ({})) as { productId?: string }
  if (!productId) return apiError('productId is required', 400)

  await db.delete(wishlists)
    .where(and(eq(wishlists.userId, auth.user.sub), eq(wishlists.productId, productId)))

  return apiOk({ message: 'Wishlist item removed. Add to cart client-side.' })
}
