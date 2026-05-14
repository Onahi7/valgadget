import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const converted = searchParams.get('converted')

  const [user] = await db.select({ affiliateCode: users.affiliateCode })
    .from(users)
    .where(eq(users.id, auth.user.sub))
    .limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const conditions = [eq(affiliateClicks.code, user.affiliateCode)]
  if (converted === 'true') conditions.push(sql`${affiliateClicks.convertedAt} is not null`)
  if (converted === 'false') conditions.push(sql`${affiliateClicks.convertedAt} is null`)

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(affiliateClicks)
    .where(where)

  const data = await db.select({
    id: affiliateClicks.id,
    affiliateCode: affiliateClicks.code,
    referrer: affiliateClicks.referrer,
    userAgent: affiliateClicks.userAgent,
    country: sql<string>`null`,
    converted: sql<boolean>`case when ${affiliateClicks.convertedAt} is not null then true else false end`,
    orderId: affiliateClicks.orderId,
    orderValue: sql<string>`null`,
    commission: affiliateClicks.commission,
    createdAt: affiliateClicks.createdAt,
  })
    .from(affiliateClicks)
    .where(where)
    .orderBy(desc(affiliateClicks.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({ data: data.map(d => ({
    ...d,
    commission: d.commission ? Number(d.commission) : 0,
    orderValue: d.orderValue ? Number(d.orderValue) : undefined,
  })), total: count, page, totalPages: Math.max(1, Math.ceil(count / limit)) })
}
