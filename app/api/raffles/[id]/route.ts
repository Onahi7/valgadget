import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffles, raffleEntries } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id)).limit(1)
  if (!raffle) return apiError('Raffle not found.', 404)

  // If authenticated, add user entry info
  const user = await (async () => {
    try {
      const { getRequestUser } = await import('@/lib/server/auth-helpers')
      return await getRequestUser(req)
    } catch { return null }
  })()

  let myEntry = null
  if (user) {
    const [entry] = await db.select().from(raffleEntries)
      .where(eq(raffleEntries.raffleId, id)).limit(1)
    myEntry = entry ?? null
  }

  return apiOk({
    ...raffle,
    prizeValue:     Number(raffle.prizeValue),
    ticketPrice:    Number(raffle.ticketPrice),
    isEntered:      !!myEntry,
    myTicketCount:  myEntry?.ticketCount ?? 0,
  })
}

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

    const ticketPrice = Number(raffle.ticketPrice)
    const totalPaid   = ticketPrice * ticketCount

    // Assign sequential ticket numbers
    const start  = raffle.soldTickets + 1
    const ticketNums = Array.from({ length: ticketCount }, (_, i) => start + i)

    const [entry] = await db.insert(raffleEntries).values({
      raffleId: id,
      userId: auth.user.sub,
      ticketCount,
      ticketNums,
      totalPaid: String(totalPaid.toFixed(2)),
    }).returning()

    await db.update(raffles).set({ soldTickets: raffle.soldTickets + ticketCount, updatedAt: new Date() })
      .where(eq(raffles.id, id))

    return apiOk({ ...entry, totalPaid: Number(entry.totalPaid) }, 201)
  } catch (err) {
    console.error('[raffle enter]', err)
    return apiError('Failed to enter raffle. Please try again.', 500)
  }
}
