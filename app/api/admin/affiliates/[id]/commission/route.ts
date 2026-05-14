import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { siteSettings } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { commissionRate } = await req.json().catch(() => ({})) as { commissionRate?: number }

  if (commissionRate === undefined || commissionRate < 0 || commissionRate > 1) {
    return apiError('commissionRate must be between 0 and 1', 400)
  }

  const key = `affiliate_commission_rate:${id}`
  const value = commissionRate.toString()

  await db.insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } })

  return apiOk({ message: 'Commission rate updated.' })
}
