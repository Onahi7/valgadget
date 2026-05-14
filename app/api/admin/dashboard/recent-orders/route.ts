import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders, users } from '@/lib/server/schema'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') ?? '10')))

  const data = await db.select({
    id: orders.id,
    reference: orders.reference,
    total: orders.total,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    createdAt: orders.createdAt,
    itemCount: sql<number>`jsonb_array_length(${orders.items}::jsonb)::int`,
    customer: { name: users.name, email: users.email },
  })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)

  return apiOk(data.map(o => ({
    ...o,
    total: Number(o.total),
  })))
}
