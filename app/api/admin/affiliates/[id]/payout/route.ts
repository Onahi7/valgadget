/**
 * POST /api/admin/affiliates/[id]/payout
 * Mark an affiliate's pending earnings as paid.
 * Moves affiliateBalance to 0 and records the payout.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, affiliateClicks } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, isNotNull, sql } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params

  // Get current balance
  const [affiliate] = await db.select({
    id: users.id, name: users.name, affiliateCode: users.affiliateCode, affiliateBalance: users.affiliateBalance, role: users.role,
  }).from(users).where(eq(users.id, id)).limit(1)

  if (!affiliate) return apiError('Affiliate not found', 404)
  if (affiliate.role !== 'affiliate') return apiError('User is not an affiliate', 400)

  const balance = Number(affiliate.affiliateBalance ?? 0)
  if (balance <= 0) return apiError('No pending earnings to pay out', 400)

  // Reset balance to 0 and mark converted clicks as paid
  await db.update(users)
    .set({ affiliateBalance: '0', updatedAt: new Date() })
    .where(eq(users.id, id))

  // Mark all un-converted clicks for this affiliate as converted now
  if (affiliate.affiliateCode) {
    await db.update(affiliateClicks)
      .set({ convertedAt: new Date() })
      .where(and(
        eq(affiliateClicks.code, affiliate.affiliateCode),
        sql`${affiliateClicks.convertedAt} IS NULL`,
      ))
  }

  return apiOk({ paid: balance, affiliateId: id })
}
