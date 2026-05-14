import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { wishlists } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { productId } = await context.params

  const [existing] = await db.select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, auth.user.sub), eq(wishlists.productId, productId)))
    .limit(1)

  return apiOk({ isInWishlist: !!existing })
}
