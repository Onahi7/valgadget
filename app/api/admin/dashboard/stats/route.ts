import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, orders, products, raffleEntries, raffles } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { count, sum, sql, eq } from 'drizzle-orm'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = monthStart

  const [[userStats], [orderStats], [productStats], [raffleStats]] = await Promise.all([
    db.select({
      total: count(),
      customers: sql<number>`sum(case when ${users.role} = 'customer' then 1 else 0 end)::int`,
      affiliates: sql<number>`sum(case when ${users.role} = 'affiliate' then 1 else 0 end)::int`,
      newThisMonth: sql<number>`sum(case when ${users.createdAt} >= ${monthStart} then 1 else 0 end)::int`,
    }).from(users),

    db.select({
      total: count(),
      today: sql<number>`sum(case when ${orders.createdAt} >= ${todayStart} then 1 else 0 end)::int`,
      pending: sql<number>`sum(case when ${orders.status} = 'pending' then 1 else 0 end)::int`,
      processing: sql<number>`sum(case when ${orders.status} = 'processing' then 1 else 0 end)::int`,
      shipped: sql<number>`sum(case when ${orders.status} = 'shipped' then 1 else 0 end)::int`,
      delivered: sql<number>`sum(case when ${orders.status} = 'delivered' then 1 else 0 end)::int`,
      cancelled: sql<number>`sum(case when ${orders.status} = 'cancelled' then 1 else 0 end)::int`,
      revenueTotal: sum(orders.total),
      revenueToday: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${orders.createdAt} >= ${todayStart} then ${orders.total} else 0 end), '0')`,
      revenueThisMonth: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${orders.createdAt} >= ${monthStart} then ${orders.total} else 0 end), '0')`,
      revenueLastMonth: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' and ${orders.createdAt} >= ${lastMonthStart} and ${orders.createdAt} < ${lastMonthEnd} then ${orders.total} else 0 end), '0')`,
    }).from(orders),

    db.select({
      total: count(),
      active: sql<number>`sum(case when ${products.isActive} = true then 1 else 0 end)::int`,
      lowStock: sql<number>`sum(case when ${products.stock} <= ${products.lowStockThreshold} then 1 else 0 end)::int`,
      outOfStock: sql<number>`sum(case when ${products.stock} = 0 then 1 else 0 end)::int`,
    }).from(products),

    db.select({
      activeRaffles: sql<number>`sum(case when ${raffles.status} = 'active' then 1 else 0 end)::int`,
      totalRevenue: sum(raffleEntries.totalPaid),
    })
      .from(raffles)
      .leftJoin(raffleEntries, eq(raffles.id, raffleEntries.raffleId)),

  ])

  const [activeCustomers] = await db.select({
    active: sql<number>`count(distinct ${orders.userId})::int`,
  }).from(orders).where(sql`${orders.userId} is not null`)

  const revenueThisMonth = Number(orderStats?.revenueThisMonth ?? 0)
  const revenueLastMonth = Number(orderStats?.revenueLastMonth ?? 0)
  const growthPercent = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : revenueThisMonth > 0 ? 100 : 0

  return apiOk({
    revenue: {
      total: Number(orderStats?.revenueTotal ?? 0),
      today: Number(orderStats?.revenueToday ?? 0),
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      growthPercent: Number(growthPercent.toFixed(2)),
    },
    orders: {
      total: orderStats?.total ?? 0,
      today: orderStats?.today ?? 0,
      pending: orderStats?.pending ?? 0,
      processing: orderStats?.processing ?? 0,
      shipped: orderStats?.shipped ?? 0,
      delivered: orderStats?.delivered ?? 0,
      cancelled: orderStats?.cancelled ?? 0,
    },
    customers: {
      total: userStats?.customers ?? 0,
      newThisMonth: userStats?.newThisMonth ?? 0,
      active: activeCustomers?.active ?? 0,
    },
    products: {
      total: productStats?.total ?? 0,
      active: productStats?.active ?? 0,
      lowStock: productStats?.lowStock ?? 0,
      outOfStock: productStats?.outOfStock ?? 0,
    },
    affiliates: {
      total: userStats?.affiliates ?? 0,
      pendingPayouts: 0,
      pendingAmount: 0,
    },
    raffles: {
      active: raffleStats?.activeRaffles ?? 0,
      totalRevenue: Number(raffleStats?.totalRevenue ?? 0),
    },
  })
}
