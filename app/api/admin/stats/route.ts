import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, orders, products, raffleEntries } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { count, sum, sql, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const [[userStats], [orderStats], [productStats], [raffleStats]] = await Promise.all([
    db.select({
      total:      count(),
      customers:  sql<number>`sum(case when role = 'customer' then 1 else 0 end)::int`,
      affiliates: sql<number>`sum(case when role = 'affiliate' then 1 else 0 end)::int`,
    }).from(users),

    db.select({
      total:    count(),
      revenue:  sum(orders.total),
      pending:  sql<number>`sum(case when status = 'pending' then 1 else 0 end)::int`,
      confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)::int`,
    }).from(orders),

    db.select({
      total:     count(),
      active:    sql<number>`sum(case when is_active = true then 1 else 0 end)::int`,
      lowStock:  sql<number>`sum(case when stock <= low_stock_threshold then 1 else 0 end)::int`,
    }).from(products),

    db.select({ totalEntries: count() }).from(raffleEntries),
  ])

  return apiOk({
    users: {
      total:      userStats.total,
      customers:  userStats.customers,
      affiliates: userStats.affiliates,
    },
    orders: {
      total:     orderStats.total,
      revenue:   Number(orderStats.revenue ?? 0),
      pending:   orderStats.pending,
      confirmed: orderStats.confirmed,
    },
    products: {
      total:    productStats.total,
      active:   productStats.active,
      lowStock: productStats.lowStock,
    },
    raffleEntries: raffleStats.totalEntries,
  })
}
