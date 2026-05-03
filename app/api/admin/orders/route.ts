import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq, ilike, sql, and, type SQL } from 'drizzle-orm'

// GET /api/admin/orders — paginated list with optional status/search filter
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const status = searchParams.get('status') ?? undefined
  const search = searchParams.get('search') ?? undefined   // search by reference

  const conditions: SQL[] = []
  if (status) conditions.push(eq(orders.status, status))
  if (search) conditions.push(ilike(orders.reference, `%${search}%`))

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(orders).where(where)

  const data = await db.select().from(orders).where(where)
    .orderBy(desc(orders.createdAt)).limit(limit).offset((page - 1) * limit)

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
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shipping: Number(o.shipping),
    tax:      Number(o.tax),
    total:    Number(o.total),
  }
}
