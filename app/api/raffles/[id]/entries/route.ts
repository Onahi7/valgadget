import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffleEntries, users } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await context.params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10')))

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(raffleEntries)
    .where(eq(raffleEntries.raffleId, id))

  const data = await db.select({
    id: raffleEntries.id,
    raffleId: raffleEntries.raffleId,
    userId: raffleEntries.userId,
    ticketCount: raffleEntries.ticketCount,
    ticketNumbers: raffleEntries.ticketNums,
    totalPaid: raffleEntries.totalPaid,
    createdAt: raffleEntries.createdAt,
    user: { name: users.name },
  })
    .from(raffleEntries)
    .leftJoin(users, eq(raffleEntries.userId, users.id))
    .where(eq(raffleEntries.raffleId, id))
    .orderBy(desc(raffleEntries.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({
    data: data.map(r => ({ ...r, totalPaid: Number(r.totalPaid) })),
    total: count,
  })
}
