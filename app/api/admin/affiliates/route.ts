/**
 * GET /api/admin/affiliates
 * List affiliates with real click and earnings stats.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, affiliateClicks } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { desc, eq, sql, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))

  // Get affiliates with their click/earnings stats via subquery
  const affiliates = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    affiliateCode: users.affiliateCode,
    affiliateBalance: users.affiliateBalance,
    createdAt: users.createdAt,
  }).from(users)
    .where(eq(users.role, 'affiliate'))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  // Get click counts per affiliate code
  const clickStats = await db.select({
    code: affiliateClicks.code,
    totalClicks: sql<number>`count(*)::int`,
    convertedClicks: sql<number>`count(case when converted_at is not null then 1 end)::int`,
    totalCommission: sql<string>`coalesce(sum(commission), '0')`,
  }).from(affiliateClicks)
    .groupBy(affiliateClicks.code)

  const clickMap = new Map(clickStats.map(s => [s.code, s]))

  const data = affiliates.map(a => {
    const code = a.affiliateCode ?? ''
    const stats = clickMap.get(code)
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      affiliateCode: code,
      totalClicks: stats?.totalClicks ?? 0,
      convertedClicks: stats?.convertedClicks ?? 0,
      totalEarnings: Number(stats?.totalCommission ?? 0),
      pendingEarnings: Number(a.affiliateBalance ?? 0),
      paidEarnings: Number(stats?.totalCommission ?? 0) - Number(a.affiliateBalance ?? 0),
      createdAt: a.createdAt,
    }
  })

  return apiOk({ data, page, limit })
}
