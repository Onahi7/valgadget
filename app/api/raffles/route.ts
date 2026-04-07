import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffles, raffleEntries } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, desc, asc, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined

  const conditions = status ? [eq(raffles.status, status)] : []

  const data = await db.select().from(raffles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(raffles.drawDate))

  return apiOk(data.map(r => ({
    ...r,
    prizeValue:  Number(r.prizeValue),
    ticketPrice: Number(r.ticketPrice),
  })))
}
