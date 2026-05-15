/**
 * POST /api/admin/affiliates/[id]/payout
 * Mark an affiliate's pending earnings as paid.
 * Records the payout in affiliate_payouts table for audit trail.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users, affiliateClicks, affiliatePayouts } from '@/lib/server/schema'
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

  // Get admin ID from authenticated user, not request body
  const { method = 'paystack', notes: payoutNotes } = await req.json().catch(() => ({})) as { method?: string; notes?: string }

  // Create payout record
  const [payout] = await db.insert(affiliatePayouts).values({
    userId: id,
    amount: String(balance),
    method: ['bank_transfer', 'crypto', 'paystack'].includes(method) ? method : 'paystack',
    status: 'completed',
    adminId: auth.user.sub,
    notes: payoutNotes ?? `Payout for ${affiliate.name}`,
  }).returning({ id: affiliatePayouts.id })

  // Reset balance to 0
  await db.update(users)
    .set({ affiliateBalance: '0', updatedAt: new Date() })
    .where(eq(users.id, id))

  // Mark all un-converted clicks for this affiliate as paid
  if (affiliate.affiliateCode) {
    await db.update(affiliateClicks)
      .set({ paidAt: new Date() })
      .where(and(
        eq(affiliateClicks.code, affiliate.affiliateCode),
        sql`${affiliateClicks.paidAt} IS NULL`,
      ))
  }

  return apiOk({ paid: balance, affiliateId: id, payoutId: payout?.id })
}
