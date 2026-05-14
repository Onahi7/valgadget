import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliateClicks, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql } from 'drizzle-orm'

function buildLink(appUrl: string, code: string, productSlug?: string) {
  const base = appUrl.replace(/\/$/, '')
  const path = productSlug ? `/products/${productSlug}` : '/'
  return `${base}${path}?ref=${encodeURIComponent(code)}`
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const [user] = await db.select({ affiliateCode: users.affiliateCode })
    .from(users)
    .where(eq(users.id, auth.user.sub))
    .limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const code = user.affiliateCode
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const [stats] = await db.select({
    clicks: sql<number>`count(*)::int`,
    conversions: sql<number>`sum(case when ${affiliateClicks.convertedAt} is not null then 1 else 0 end)::int`,
  })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.code, code))

  return apiOk([
    {
      url: buildLink(appUrl, code),
      code,
      productSlug: undefined,
      clicks: stats?.clicks ?? 0,
      conversions: stats?.conversions ?? 0,
      createdAt: new Date().toISOString(),
    },
  ])
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const { productSlug } = await req.json().catch(() => ({})) as { productSlug?: string }

  const [user] = await db.select({ affiliateCode: users.affiliateCode })
    .from(users)
    .where(eq(users.id, auth.user.sub))
    .limit(1)

  if (!user?.affiliateCode) return apiError('No affiliate code found for this account.', 404)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const url = buildLink(appUrl, user.affiliateCode, productSlug)

  return apiOk({
    url,
    code: user.affiliateCode,
    productSlug,
    clicks: 0,
    conversions: 0,
    createdAt: new Date().toISOString(),
  }, 201)
}
