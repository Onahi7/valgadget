import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { note } = await req.json().catch(() => ({})) as { note?: string }

  if (!note) return apiError('note is required', 400)

  const [updated] = await db.update(orders)
    .set({ notes: note, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  return apiOk({ ...updated, total: Number(updated.total) })
}
