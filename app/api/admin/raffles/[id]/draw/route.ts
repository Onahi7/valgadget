import { randomInt } from 'node:crypto'
import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { raffleEntries, raffles, users } from '@/lib/server/schema'
import { apiError, apiOk, requireAuth } from '@/lib/server/auth-helpers'
import { safeSendRaffleWinnerEmail } from '@/lib/server/email'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth
  const { id } = await context.params

  const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id)).limit(1)
  if (!raffle) return apiError('Raffle not found.', 404)
  if (raffle.status !== 'active') return apiError('Only an active raffle can be drawn.', 409)

  const entries = await db.select({ userId: raffleEntries.userId, ticketNums: raffleEntries.ticketNums })
    .from(raffleEntries).where(eq(raffleEntries.raffleId, id))
  const tickets = entries.flatMap(entry => entry.ticketNums.map(ticketNumber => ({ userId: entry.userId, ticketNumber })))
  if (tickets.length === 0) return apiError('This raffle has no issued tickets.', 409)

  const selected = tickets[randomInt(tickets.length)]
  const [updated] = await db.update(raffles).set({ status: 'completed', winnerId: selected.userId, winnerTicket: selected.ticketNumber, updatedAt: new Date() })
    .where(and(eq(raffles.id, id), eq(raffles.status, 'active'))).returning()
  if (!updated) return apiError('The raffle changed while drawing. Refresh before trying again.', 409)

  const [winner] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, selected.userId)).limit(1)
  if (!winner) return apiError('Winner account could not be loaded.', 500)
  await logAdminActivity(auth.user.sub, 'drew winner', 'raffle', id, `${updated.title}: ${winner.email}, ticket #${selected.ticketNumber}`)
  safeSendRaffleWinnerEmail(winner.email, winner.name, updated.title, 'admin-raffle-draw')

  return apiOk({ raffle: { ...updated, prizeValue: Number(updated.prizeValue), ticketPrice: Number(updated.ticketPrice) }, winner: { userId: selected.userId, name: winner.name, ticketNumber: selected.ticketNumber } })
}
