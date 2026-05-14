import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { affiliatePayouts } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { status, reference, notes } = await req.json().catch(() => ({})) as {
    status?: string
    reference?: string
    notes?: string
  }

  const allowed = ['pending', 'processing', 'paid', 'rejected', 'completed']
  if (status && !allowed.includes(status)) return apiError('Invalid status', 400)

  const [updated] = await db.update(affiliatePayouts)
    .set({
      ...(status ? { status } : {}),
      ...(reference !== undefined ? { reference } : {}),
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(affiliatePayouts.id, id))
    .returning()

  if (!updated) return apiError('Payout not found', 404)

  return apiOk({
    id: updated.id,
    affiliateId: updated.userId,
    amount: Number(updated.amount),
    currency: 'NGN',
    status: updated.status,
    method: updated.method,
    reference: updated.reference,
    notes: updated.notes,
    requestedAt: updated.createdAt,
    processedAt: updated.updatedAt,
  })
}
