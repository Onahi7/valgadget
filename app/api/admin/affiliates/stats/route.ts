import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, affiliatePayouts, users } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const [totals] = await db.select({
    totalAffiliates: sql<number>`count(*)::int`,
  })
    .from(users)
    .where(eq(users.role, 'affiliate'))

  const [revenue] = await db.select({
    totalRevenue: sql<string>`coalesce(sum(${affiliateClicks.commission}), '0')`,
  }).from(affiliateClicks)

  const [paid] = await db.select({
    totalPaidOut: sql<string>`coalesce(sum(case when ${affiliatePayouts.status} in ('paid', 'completed') then ${affiliatePayouts.amount} else 0 end), '0')`,
    pendingPayouts: sql<number>`sum(case when ${affiliatePayouts.status} in ('pending', 'processing') then 1 else 0 end)::int`,
  }).from(affiliatePayouts)

  return apiOk({
    totalAffiliates: totals?.totalAffiliates ?? 0,
    totalRevenue: Number(revenue?.totalRevenue ?? 0),
    totalPaidOut: Number(paid?.totalPaidOut ?? 0),
    pendingPayouts: paid?.pendingPayouts ?? 0,
  })
}
