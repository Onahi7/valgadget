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
  const search = searchParams.get('search')?.trim() ?? undefined

  const conditions: SQL[] = []
  if (status) conditions.push(eq(orders.status, status))
  if (search) {
    conditions.push(sql`(${orders.reference} ilike ${`%${search}%`} or coalesce(${orders.shippingAddress}->>'fullName', '') ilike ${`%${search}%`})`)
  }

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(orders).where(where)

  const data = await db.select().from(orders).where(where)
    .orderBy(desc(orders.createdAt)).limit(limit).offset((page - 1) * limit)

  const [summary] = await db.select({
    revenue: sql<number>`coalesce(sum(${orders.total})::numeric, 0)`,
    pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
    confirmed: sql<number>`count(*) filter (where ${orders.status} = 'confirmed')::int`,
    processing: sql<number>`count(*) filter (where ${orders.status} = 'processing')::int`,
    shipped: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
    delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
    cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
    refunded: sql<number>`count(*) filter (where ${orders.status} = 'refunded')::int`,
  }).from(orders).where(where)

  return apiOk({
    data: data.map(numericOrder),
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
    summary: {
      revenue: Number(summary?.revenue ?? 0),
      pending: summary?.pending ?? 0,
      confirmed: summary?.confirmed ?? 0,
      processing: summary?.processing ?? 0,
      shipped: summary?.shipped ?? 0,
      delivered: summary?.delivered ?? 0,
      cancelled: summary?.cancelled ?? 0,
      refunded: summary?.refunded ?? 0,
    },
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
