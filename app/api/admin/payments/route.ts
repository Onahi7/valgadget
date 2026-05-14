import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { toPaymentIntent } from '@/lib/server/payment-intents'

function mapStatusToOrder(status?: string) {
  switch (status) {
    case 'succeeded': return ['paid']
    case 'processing': return ['pending', 'pending_verification']
    case 'pending': return ['unpaid']
    case 'failed': return ['failed']
    case 'refunded': return ['refunded']
    default: return undefined
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const status = searchParams.get('status') ?? undefined
  const method = searchParams.get('method') ?? undefined

  const conditions = [] as any[]
  const mappedStatus = mapStatusToOrder(status ?? undefined)
  if (mappedStatus?.length) {
    conditions.push(inArray(orders.paymentStatus, mappedStatus))
  }
  if (method) {
    conditions.push(eq(orders.paymentMethod, method === 'card' ? 'paystack' : method))
  }

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(where)

  const data = await db.select().from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({
    data: data.map(o => toPaymentIntent(o)),
    total: count,
    page,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  })
}
