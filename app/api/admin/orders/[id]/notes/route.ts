import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { orders } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'
import { logAdminActivity } from '@/lib/server/admin-activity'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { id } = await context.params
  const { note } = await req.json().catch(() => ({})) as { note?: unknown }
  if (note !== null && typeof note !== 'string') return apiError('note must be a string or null', 400)
  const cleanNote = typeof note === 'string' ? note.trim() : null
  if (cleanNote && cleanNote.length > 5_000) return apiError('note is too long', 422)

  const [updated] = await db.update(orders)
    .set({ notes: cleanNote || null, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()

  if (!updated) return apiError('Order not found.', 404)
  await logAdminActivity(auth.user.sub, 'updated', 'order notes', id, `${updated.reference}: ${cleanNote ? 'notes saved' : 'notes cleared'}`)
  return apiOk({ ...updated, total: Number(updated.total) })
}
