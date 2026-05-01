import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliatePayouts, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq } from 'drizzle-orm'

// GET /api/admin/affiliate-payouts — list all payouts (optionally filter by userId)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') ?? undefined

  const where = userId ? eq(affiliatePayouts.userId, userId) : undefined

  const data = await db.select({
    id: affiliatePayouts.id,
    userId: affiliatePayouts.userId,
    amount: affiliatePayouts.amount,
    method: affiliatePayouts.method,
    reference: affiliatePayouts.reference,
    status: affiliatePayouts.status,
    adminId: affiliatePayouts.adminId,
    notes: affiliatePayouts.notes,
    createdAt: affiliatePayouts.createdAt,
    userName: users.name,
  })
    .from(affiliatePayouts)
    .leftJoin(users, eq(affiliatePayouts.userId, users.id))
    .where(where)
    .orderBy(desc(affiliatePayouts.createdAt))

  return apiOk({ data, total: data.length })
}
