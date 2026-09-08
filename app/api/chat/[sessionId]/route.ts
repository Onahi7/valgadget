import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, withDbRetry } from '@/lib/server/db'
import { chatSessions } from '@/lib/server/schema'
import { apiError, apiOk, requireAuth } from '@/lib/server/auth-helpers'

type Ctx = { params: Promise<{ sessionId: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { sessionId } = await ctx.params
    const body = await req.json() as { status?: string }
    if (body.status !== 'open' && body.status !== 'closed') {
      return apiError('status must be open or closed', 400)
    }

    const [existing] = await withDbRetry(() => db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1))

    if (!existing) return apiError('Session not found', 404)

    const [session] = await db
      .update(chatSessions)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId))
      .returning()

    return apiOk(session)
  } catch {
    return apiError('Failed to update chat session', 500)
  }
}
