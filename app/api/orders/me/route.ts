import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit  = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10')))
  const status = searchParams.get('status') ?? undefined

  const conditions = status
    ? [eq(orders.userId, auth.user.sub), eq(orders.status, status)]
    : [eq(orders.userId, auth.user.sub)]

  const where = and(...conditions)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(where)

  const data = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({
    data: data.map(numericOrder),
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  })
}

function numericOrder(o: typeof orders.$inferSelect) {
  return {
    ...o,
    subtotal:  Number(o.subtotal),
    discount:  Number(o.discount),
    shipping:  Number(o.shipping),
    tax:       Number(o.tax),
    total:     Number(o.total),
  }
}
