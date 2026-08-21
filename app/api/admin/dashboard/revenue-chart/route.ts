import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { desc, gte, sql } from 'drizzle-orm'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const days = Math.max(1, Math.min(90, Number(searchParams.get('days') ?? '30')))

  const now = new Date()
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)))

  const [rows, refundRows] = await Promise.all([
    db.select({
      day: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
      revenue: sql<string>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orders.total} else 0 end), '0')`,
      orderCount: sql<number>`count(*)::int`,
    }).from(orders)
      .where(gte(orders.createdAt, from))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(desc(sql`date_trunc('day', ${orders.createdAt})`)),
    db.select({
      day: sql<string>`date_trunc('day', ${orders.refundedAt})::date`,
      refunds: sql<string>`coalesce(sum(${orders.refundAmount}), '0')`,
    }).from(orders)
      .where(gte(orders.refundedAt, from))
      .groupBy(sql`date_trunc('day', ${orders.refundedAt})`),
  ])

  const byDay = new Map(rows.map(r => [r.day, r]))
  const refundsByDay = new Map(refundRows.map(r => [r.day, Number(r.refunds ?? 0)]))

  const data = [] as Array<{ date: string; revenue: number; orders: number; refunds: number }>
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const row = byDay.get(key)
    data.push({
      date: key,
      revenue: Number(row?.revenue ?? 0),
      orders: row?.orderCount ?? 0,
      refunds: refundsByDay.get(key) ?? 0,
    })
  }

  return apiOk(data)
}
