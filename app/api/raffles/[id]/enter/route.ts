import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffles, raffleEntries } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, sql, and } from 'drizzle-orm'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { id } = await context.params

  try {
    const { ticketCount = 1 } = await req.json()

    const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id)).limit(1)
    if (!raffle) return apiError('Raffle not found.', 404)
    if (raffle.status !== 'active') return apiError('This raffle is not currently accepting entries.')

    const available = raffle.maxTickets - raffle.soldTickets
    if (ticketCount > available) return apiError(`Only ${available} tickets remaining.`)

    const [updated] = await db.update(raffles)
      .set({ soldTickets: sql`${raffles.soldTickets} + ${ticketCount}`, updatedAt: new Date() })
      .where(and(eq(raffles.id, id), sql`${raffles.soldTickets} + ${ticketCount} <= ${raffles.maxTickets}`))
      .returning({ id: raffles.id, soldTickets: raffles.soldTickets })

    if (!updated) return apiError('Not enough tickets remaining. Please try again.', 409)

    const ticketPrice = Number(raffle.ticketPrice)
    const totalPaid = ticketPrice * ticketCount

    const start = updated.soldTickets - ticketCount + 1
    const ticketNums = Array.from({ length: ticketCount }, (_, i) => start + i)

    const [entry] = await db.insert(raffleEntries).values({
      raffleId: id,
      userId: auth.user.sub,
      ticketCount,
      ticketNums,
      totalPaid: String(totalPaid.toFixed(2)),
    }).returning()

    return apiOk({ ...entry, totalPaid: Number(entry.totalPaid) }, 201)
  } catch (err) {
    console.error('[raffle enter]', err)
    return apiError('Failed to enter raffle. Please try again.', 500)
  }
}
