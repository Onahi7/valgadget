import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ? new Date(searchParams.get('from') as string) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to') as string) : undefined

  const where = from && to
    ? sql`${orders.createdAt} >= ${from} and ${orders.createdAt} <= ${to}`
    : from
      ? sql`${orders.createdAt} >= ${from}`
      : to
        ? sql`${orders.createdAt} <= ${to}`
        : undefined

  const [summary] = await db.select({
    revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
    totalOrders: sql<number>`count(*)::int`,
    avgOrderValue: sql<string>`coalesce(avg(${orders.total}), '0')`,
    pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
    confirmed: sql<number>`count(*) filter (where ${orders.status} = 'confirmed')::int`,
    processing: sql<number>`count(*) filter (where ${orders.status} = 'processing')::int`,
    shipped: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
    delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
    cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
    refunded: sql<number>`count(*) filter (where ${orders.status} = 'refunded')::int`,
  }).from(orders).where(where)

  const byDay = await db.select({
    day: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
    revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
    orders: sql<number>`count(*)::int`,
  }).from(orders)
    .where(where)
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`)

  return apiOk({
    totalRevenue: Number(summary?.revenue ?? 0),
    totalOrders: summary?.totalOrders ?? 0,
    avgOrderValue: Number(summary?.avgOrderValue ?? 0),
    byStatus: {
      pending: summary?.pending ?? 0,
      confirmed: summary?.confirmed ?? 0,
      processing: summary?.processing ?? 0,
      shipped: summary?.shipped ?? 0,
      delivered: summary?.delivered ?? 0,
      cancelled: summary?.cancelled ?? 0,
      refunded: summary?.refunded ?? 0,
    },
    revenueByDay: byDay.map(d => ({
      date: d.day,
      revenue: Number(d.revenue ?? 0),
      orders: d.orders ?? 0,
    })),
  })
}
