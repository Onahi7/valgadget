import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffles, raffleEntries, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { safeSendRaffleWinnerEmail } from '@/lib/server/email'

// GET /api/admin/raffles/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id)).limit(1)
  if (!raffle) return apiError('Raffle not found.', 404)

  const entries = await db.select({
    id: raffleEntries.id,
    userId: raffleEntries.userId,
    ticketCount: raffleEntries.ticketCount,
    ticketNums:  raffleEntries.ticketNums,
    totalPaid:   raffleEntries.totalPaid,
    createdAt:   raffleEntries.createdAt,
    userName:    users.name,
    userEmail:   users.email,
  }).from(raffleEntries)
    .innerJoin(users, eq(raffleEntries.userId, users.id))
    .where(eq(raffleEntries.raffleId, id))

  return apiOk({
    ...raffle,
    prizeValue:  Number(raffle.prizeValue),
    ticketPrice: Number(raffle.ticketPrice),
    entries: entries.map(e => ({ ...e, totalPaid: Number(e.totalPaid) })),
  })
}

// PATCH /api/admin/raffles/[id] — update raffle fields
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  try {
    const body = await req.json()
    const { status, winnerId, drawDate, description, title, prize, prizeValue, ticketPrice, maxTickets, image } = body

    const [updated] = await db.update(raffles)
      .set({
        ...(status      !== undefined && { status }),
        ...(winnerId    !== undefined && { winnerId }),
        ...(drawDate    !== undefined && { drawDate: new Date(drawDate) }),
        ...(description !== undefined && { description }),
        ...(title       !== undefined && { title }),
        ...(prize       !== undefined && { prize }),
        ...(prizeValue  !== undefined && { prizeValue: String(prizeValue) }),
        ...(ticketPrice !== undefined && { ticketPrice: String(ticketPrice) }),
        ...(maxTickets  !== undefined && { maxTickets: Number(maxTickets) }),
        ...(image       !== undefined && { image }),
        updatedAt: new Date(),
      })
      .where(eq(raffles.id, id))
      .returning()

    if (!updated) return apiError('Raffle not found.', 404)

    // If a winner was just assigned, email them
    if (winnerId) {
      const [winner] = await db.select({ email: users.email, name: users.name })
        .from(users).where(eq(users.id, winnerId)).limit(1)
      if (winner) {
        safeSendRaffleWinnerEmail(winner.email, winner.name, updated.title, 'admin-raffle-draw')
      }
    }

    return apiOk({ ...updated, prizeValue: Number(updated.prizeValue), ticketPrice: Number(updated.ticketPrice) })
  } catch (err) {
    console.error('[admin patch raffle]', err)
    return apiError('Failed to update raffle.', 500)
  }
}

// DELETE /api/admin/raffles/[id] — only allowed when raffle is upcoming
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const [raffle] = await db.select({ status: raffles.status }).from(raffles).where(eq(raffles.id, id)).limit(1)
  if (!raffle) return apiError('Raffle not found.', 404)
  if (raffle.status !== 'upcoming') return apiError('Only upcoming raffles can be deleted.', 422)

  await db.delete(raffles).where(eq(raffles.id, id))
  return apiOk({ message: 'Raffle deleted.' })
}
