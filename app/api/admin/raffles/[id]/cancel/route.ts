import { NextRequest } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { raffles } from '@/lib/server/schema'
import { apiError, apiOk, requireAuth } from '@/lib/server/auth-helpers'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth
  const { id } = await context.params
  const { reason } = await req.json().catch(() => ({})) as { reason?: string }
  const cleanReason = reason?.trim() || 'Cancelled by administrator'
  if (cleanReason.length > 1_000) return apiError('Cancellation reason is too long.', 422)

  const [existing] = await db.select({ status: raffles.status }).from(raffles).where(eq(raffles.id, id)).limit(1)
  if (!existing) return apiError('Raffle not found.', 404)
  if (!['upcoming', 'active'].includes(existing.status)) return apiError('Only an upcoming or active raffle can be cancelled.', 409)

  const [updated] = await db.update(raffles).set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(raffles.id, id), inArray(raffles.status, ['upcoming', 'active']))).returning()
  if (!updated) return apiError('Only an upcoming or active raffle can be cancelled.', 409)
  await logAdminActivity(auth.user.sub, 'cancelled', 'raffle', id, `${updated.title}: ${cleanReason}`)
  return apiOk({ ...updated, prizeValue: Number(updated.prizeValue), ticketPrice: Number(updated.ticketPrice) })
}
