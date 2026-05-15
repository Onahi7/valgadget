import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { reviews, orders, products, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return apiError('Product ID is required', 400)
    }

    // Get reviews with user info
    const productReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verified: reviews.verified,
        createdAt: reviews.createdAt,
        user: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(and(
        eq(reviews.productId, productId),
        eq(reviews.isActive, true)
      ))
      .orderBy(desc(reviews.createdAt))

    return apiOk(productReviews)
  } catch (err) {
    console.error('[get reviews]', err)
    return apiError('Failed to fetch reviews', 500)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    // Rate limit reviews
    const rl = rateLimit(getRateLimitKey(req), rateLimitPresets.review)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const { productId, rating, title, body } = await req.json()

    if (!productId || !rating || !body) {
      return apiError('Product ID, rating, and review body are required', 400)
    }

    if (rating < 1 || rating > 5) {
      return apiError('Rating must be between 1 and 5', 400)
    }

    // Sanitize input
    const sanitizedTitle = title?.trim().slice(0, 200) || null
    const sanitizedBody = body.trim().slice(0, 5000)

    // Check if user already reviewed this product
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.productId, productId),
        eq(reviews.userId, auth.user.sub)
      ))
      .limit(1)

    if (existingReview) {
      return apiError('You have already reviewed this product', 400)
    }

    // Check if user purchased this product (for verified badge)
    const [purchase] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(
        eq(orders.userId, auth.user.sub),
        eq(orders.status, 'delivered'),
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${orders.items}) AS item
          WHERE item->>'productId' = ${productId}
        )`
      ))
      .limit(1)

    const verified = !!purchase

    // Create review
    const [review] = await db
      .insert(reviews)
      .values({
        productId,
        userId: auth.user.sub,
        rating,
        title: sanitizedTitle,
        body: sanitizedBody,
        verified,
        isActive: true,
      })
      .returning()

    // Update product rating
    const [stats] = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})::numeric(3,2)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(and(
        eq(reviews.productId, productId),
        eq(reviews.isActive, true)
      ))

    await db
      .update(products)
      .set({
        rating: stats.avgRating.toString(),
        reviewCount: stats.count,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))

    return apiOk(review, 201)
  } catch (err) {
    console.error('[create review]', err)
    return apiError('Failed to submit review', 500)
  }
}
