import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliatePayouts, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.userId, auth.user.sub))

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
  })
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.userId, auth.user.sub))
    .orderBy(desc(affiliatePayouts.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({ data: data.map(p => ({
    ...p,
    amount: Number(p.amount),
  })), total: count, page, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['affiliate', 'admin'])
  if ('status' in auth) return auth

  const { amount, method, accountDetails } = await req.json().catch(() => ({})) as {
    amount?: number
    method?: string
    accountDetails?: string
  }

  if (!amount || amount <= 0) return apiError('amount is required', 400)
  if (!method) return apiError('method is required', 400)

  const [user] = await db.select({ affiliateBalance: users.affiliateBalance })
    .from(users)
    .where(eq(users.id, auth.user.sub))
    .limit(1)

  const balance = Number(user?.affiliateBalance ?? 0)
  if (amount > balance) return apiError('Requested amount exceeds available balance', 400)

  const [created] = await db.transaction(async (tx) => {
    const [updatedUser] = await tx.update(users)
      .set({ affiliateBalance: String(balance - amount), updatedAt: new Date() })
      .where(eq(users.id, auth.user.sub))
      .returning({ id: users.id })

    if (!updatedUser) throw new Error('Unable to update balance')

    const [payout] = await tx.insert(affiliatePayouts).values({
      userId: auth.user.sub,
      amount: String(amount),
      method,
      status: 'pending',
      notes: accountDetails ? `Account: ${accountDetails}` : null,
    }).returning()

    return [payout] as const
  })

  return apiOk({
    id: created.id,
    affiliateId: created.userId,
    amount: Number(created.amount),
    currency: 'NGN',
    status: created.status,
    method: created.method,
    accountDetails: accountDetails ?? null,
    reference: created.reference,
    notes: created.notes,
    requestedAt: created.createdAt,
    processedAt: created.updatedAt,
  }, 201)
}
