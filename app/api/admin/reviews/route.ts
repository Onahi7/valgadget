import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { reviews, users, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  if (auth.user.role !== 'admin') {
    return apiError('Unauthorized', 403)
  }

  try {
    const allReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verified: reviews.verified,
        isActive: reviews.isActive,
        createdAt: reviews.createdAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id))
      .orderBy(desc(reviews.createdAt))

    return apiOk(allReviews)
  } catch (err) {
    console.error('[get admin reviews]', err)
    return apiError('Failed to fetch reviews', 500)
  }
}
