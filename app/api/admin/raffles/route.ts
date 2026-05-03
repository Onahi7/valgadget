import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { raffles } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq, sql } from 'drizzle-orm'

// GET /api/admin/raffles — list all raffles
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, Number(searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(raffles)

  const data = await db.select().from(raffles)
    .orderBy(desc(raffles.createdAt)).limit(limit).offset((page - 1) * limit)

  return apiOk({
    data: data.map(numericRaffle),
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  })
}

// POST /api/admin/raffles — create a new raffle
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const {
      title, description, prize, image, prizeValue, ticketPrice, maxTickets,
      drawDate, status = 'upcoming',
    } = body

    if (!title || !prize || !prizeValue || !ticketPrice || !maxTickets || !drawDate) {
      return apiError('title, prize, prizeValue, ticketPrice, maxTickets, and drawDate are required.')
    }

    const [raffle] = await db.insert(raffles).values({
      title, description, prize, image: image ?? null,
      prizeValue:  String(prizeValue),
      ticketPrice: String(ticketPrice),
      maxTickets,
      drawDate: new Date(drawDate),
      status,
    }).returning()

    return apiOk(numericRaffle(raffle), 201)
  } catch (err) {
    console.error('[admin create raffle]', err)
    return apiError('Failed to create raffle.', 500)
  }
}

function numericRaffle(r: typeof raffles.$inferSelect) {
  return { ...r, prizeValue: Number(r.prizeValue), ticketPrice: Number(r.ticketPrice) }
}
