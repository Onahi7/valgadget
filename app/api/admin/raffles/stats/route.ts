import { NextRequest } from 'next/server'
import { count, sql, sum } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { raffleEntries, raffles } from '@/lib/server/schema'
import { apiOk, requireAuth } from '@/lib/server/auth-helpers'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth
  const [[raffleStats], [entryStats]] = await Promise.all([
    db.select({ totalRaffles: count(), activeRaffles: sql<number>`count(*) filter (where ${raffles.status} = 'active')::int` }).from(raffles),
    db.select({ totalEntries: count(), totalRevenue: sum(raffleEntries.totalPaid) }).from(raffleEntries),
  ])
  return apiOk({ totalRaffles: raffleStats?.totalRaffles ?? 0, activeRaffles: raffleStats?.activeRaffles ?? 0, totalRevenue: Number(entryStats?.totalRevenue ?? 0), totalEntries: entryStats?.totalEntries ?? 0 })
}
