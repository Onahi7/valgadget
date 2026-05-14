import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'month'
  const days = period === 'week' ? 7 : period === 'year' ? 365 : 30

  const [user] = await db.select({ affiliateCode: users.affiliateCode })
    .from(users)
    .where(eq(users.id, auth.user.sub))
    .limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000))

  const rows = await db.select({
    day: sql<string>`date_trunc('day', ${affiliateClicks.createdAt})::date`,
    clicks: sql<number>`count(*)::int`,
    conversions: sql<number>`sum(case when ${affiliateClicks.convertedAt} is not null then 1 else 0 end)::int`,
    earnings: sql<string>`coalesce(sum(${affiliateClicks.commission}), '0')`,
  })
    .from(affiliateClicks)
    .where(sql`${affiliateClicks.code} = ${user.affiliateCode} and ${affiliateClicks.createdAt} >= ${from}`)
    .groupBy(sql`date_trunc('day', ${affiliateClicks.createdAt})`)

  const byDay = new Map(rows.map(r => [r.day, r]))

  const data = [] as Array<{ date: string; clicks: number; conversions: number; earnings: number }>
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const row = byDay.get(key)
    data.push({
      date: key,
      clicks: row?.clicks ?? 0,
      conversions: row?.conversions ?? 0,
      earnings: Number(row?.earnings ?? 0),
    })
  }

  return apiOk(data)
}
