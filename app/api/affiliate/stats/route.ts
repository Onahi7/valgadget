import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, orders, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const [user] = await db.select({
    id: users.id,
    affiliateCode: users.affiliateCode,
    affiliateBalance: users.affiliateBalance,
  }).from(users).where(eq(users.id, auth.user.sub)).limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const code = user.affiliateCode
  const monthStart = startOfMonth(new Date())

  const [totals] = await db.select({
    totalClicks: sql<number>`count(*)::int`,
    totalConversions: sql<number>`sum(case when ${affiliateClicks.convertedAt} is not null then 1 else 0 end)::int`,
    totalEarnings: sql<string>`coalesce(sum(${affiliateClicks.commission}), '0')`,
    thisMonthClicks: sql<number>`sum(case when ${affiliateClicks.createdAt} >= ${monthStart} then 1 else 0 end)::int`,
    thisMonthConversions: sql<number>`sum(case when ${affiliateClicks.createdAt} >= ${monthStart} and ${affiliateClicks.convertedAt} is not null then 1 else 0 end)::int`,
    thisMonthEarnings: sql<string>`coalesce(sum(case when ${affiliateClicks.createdAt} >= ${monthStart} then ${affiliateClicks.commission} else 0 end), '0')`,
  })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.code, code))

  const [lifetimeOrders] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(orders)
    .where(eq(orders.affiliateCode, code))

  const totalClicks = totals?.totalClicks ?? 0
  const totalConversions = totals?.totalConversions ?? 0
  const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0

  const totalEarnings = Number(totals?.totalEarnings ?? 0)
  const pendingEarnings = Number(user.affiliateBalance ?? 0)
  const paidEarnings = Math.max(0, totalEarnings - pendingEarnings)

  return apiOk({
    affiliateCode: code,
    totalClicks,
    totalConversions,
    conversionRate,
    totalEarnings,
    pendingEarnings,
    paidEarnings,
    thisMonthClicks: totals?.thisMonthClicks ?? 0,
    thisMonthConversions: totals?.thisMonthConversions ?? 0,
    thisMonthEarnings: Number(totals?.thisMonthEarnings ?? 0),
    commissionRate: 0.05,
    lifetimeOrders: lifetimeOrders?.count ?? 0,
  })
}
