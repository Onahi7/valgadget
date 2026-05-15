import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { reviews, users, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError, getRequestUser } from '@/lib/server/auth-helpers'
import { eq, desc, sql, and } from 'drizzle-orm'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, Number(searchParams.get('page')  ?? '1'))
  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? '10')))

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(reviews).where(eq(reviews.productId, id))

  const data = await db.select({
    id: reviews.id, rating: reviews.rating, title: reviews.title,
    body: reviews.body, createdAt: reviews.createdAt,
    user: { id: users.id, name: users.name, avatar: users.avatar },
  }).from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, id))
    .orderBy(desc(reviews.createdAt)).limit(limit).offset((page - 1) * limit)

  return apiOk({ data, total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('status' in auth) return auth

  const { id } = await context.params

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1)
  if (!product) return apiError('Product not found.', 404)

  const body = await request.json().catch(() => null)
  const { rating, title, body: reviewBody } = body ?? {}

  if (!rating || !reviewBody) return apiError('Rating and review body are required.')
  if (rating < 1 || rating > 5) return apiError('Rating must be between 1 and 5.')

  // Prevent duplicate review
  const [existing] = await db.select({ id: reviews.id })
    .from(reviews).where(and(eq(reviews.productId, id), eq(reviews.userId, auth.user.sub))).limit(1)
  if (existing) return apiError('You have already reviewed this product.', 409)

  const [review] = await db.insert(reviews).values({
    productId: id, userId: auth.user.sub, rating, title, body: reviewBody,
  }).returning()

  // Update product average rating
  await db.execute(
    sql`UPDATE products SET rating = (
      SELECT avg(rating) FROM reviews WHERE product_id = ${id}
    ), review_count = (
      SELECT count(*) FROM reviews WHERE product_id = ${id}
    ), updated_at = now() WHERE id = ${id}`
  )

  return apiOk(review, 201)
}
