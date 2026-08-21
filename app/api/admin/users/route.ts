import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, ilike, eq, sql, and, or, inArray, type SQL, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const role   = searchParams.get('role') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const conditions: SQL[] = []
  if (role)   conditions.push(eq(users.role, role))
  if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!)

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(where)

  const data = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
    affiliateCode: users.affiliateCode, createdAt: users.createdAt, updatedAt: users.updatedAt,
  }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset((page - 1) * limit)

  // Fetch orders count and total spent for each user
  const userIds = data.map(u => u.id)
  let ordersData: { userId: string; orders: number; spent: number }[] = []
  if (userIds.length > 0) {
    const result = await db.select({
      userId: orders.userId,
      orders: count(orders.id).as('orders'),
      spent: sql<number>`COALESCE(SUM(${orders.total})::int, 0)`.as('spent'),
    })
    .from(orders)
    .where(inArray(orders.userId, userIds))
    .groupBy(orders.userId)

    ordersData = result as any
  }

  const userMap = new Map(ordersData.map(o => [o.userId, o]))
  const enriched = data.map(u => ({
    ...u,
    orders: userMap.get(u.id)?.orders ?? 0,
    spent: userMap.get(u.id)?.spent ?? 0,
  }))

  return apiOk({ data: enriched, total: totalCount, page, limit, totalPages: Math.max(1, Math.ceil(totalCount / limit)) })
}
