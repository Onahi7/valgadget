import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliatePayouts, users } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined

  const where = status ? eq(affiliatePayouts.status, status) : undefined

  const data = await db.select({
    id: affiliatePayouts.id,
    affiliateId: affiliatePayouts.userId,
    amount: affiliatePayouts.amount,
    currency: sql<string>`'NGN'`,
    status: affiliatePayouts.status,
    method: affiliatePayouts.method,
    accountDetails: sql<string>`null`,
    reference: affiliatePayouts.reference,
    notes: affiliatePayouts.notes,
    requestedAt: affiliatePayouts.createdAt,
    processedAt: affiliatePayouts.updatedAt,
    userName: users.name,
  })
    .from(affiliatePayouts)
    .leftJoin(users, eq(affiliatePayouts.userId, users.id))
    .where(where)
    .orderBy(desc(affiliatePayouts.createdAt))

  return apiOk({ data: data.map(p => ({ ...p, amount: Number(p.amount) })), total: data.length })
}
