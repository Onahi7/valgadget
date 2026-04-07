import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, orders, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, count, sum, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  // Get affiliate user record
  const [user] = await db.select({
    id: users.id,
    affiliateCode: users.affiliateCode,
    affiliateBalance: users.affiliateBalance,
  }).from(users).where(eq(users.id, auth.user.sub)).limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const code = user.affiliateCode

  // Clicks summary
  const [clickStats] = await db.select({
    totalClicks: count(),
    conversions: sql<number>`sum(case when converted_at is not null then 1 else 0 end)::int`,
  }).from(affiliateClicks).where(eq(affiliateClicks.code, code))

  // Revenue
  const [revenueStats] = await db.select({
    totalCommission: sum(affiliateClicks.commission),
  }).from(affiliateClicks).where(eq(affiliateClicks.code, code))

  // Recent activity
  const recent = await db.select({
    id: affiliateClicks.id,
    createdAt: affiliateClicks.createdAt,
    convertedAt: affiliateClicks.convertedAt,
    commission: affiliateClicks.commission,
  }).from(affiliateClicks).where(eq(affiliateClicks.code, code))
    .orderBy(sql`created_at desc`).limit(10)

  return apiOk({
    code,
    balance:         Number(user.affiliateBalance ?? 0),
    totalClicks:     clickStats?.totalClicks ?? 0,
    conversions:     clickStats?.conversions ?? 0,
    conversionRate:  clickStats?.totalClicks
      ? ((clickStats.conversions / clickStats.totalClicks) * 100).toFixed(1) + '%'
      : '0%',
    totalCommission: Number(revenueStats?.totalCommission ?? 0),
    recentActivity:  recent.map(r => ({ ...r, commission: r.commission ? Number(r.commission) : null })),
  })
}

/** Track an affiliate link click */
export async function POST(req: NextRequest) {
  try {
    const { code, referrer } = await req.json()
    if (!code) return apiError('Affiliate code is required.')

    const userAgent = req.headers.get('user-agent') ?? undefined
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined

    await db.insert(affiliateClicks).values({ code, referrer, userAgent, ip })
    return apiOk({ message: 'Click tracked.' })
  } catch (err) {
    console.error('[affiliate click]', err)
    return apiOk({ message: 'Click tracked.' }) // silent fail — don't break user flow
  }
}
