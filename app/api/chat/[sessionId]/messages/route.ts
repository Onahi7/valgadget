/**
 * GET  /api/chat/[sessionId]/messages  — fetch messages for a session
 * POST /api/chat/[sessionId]/messages  — send a message
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { chatMessages, chatSessions } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, asc } from 'drizzle-orm'

type Ctx = { params: Promise<{ sessionId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { sessionId } = await ctx.params

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))

    return apiOk(messages)
  } catch (err) {
    console.error('[chat messages GET]', err)
    return apiError('Failed to fetch messages', 500)
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { sessionId } = await ctx.params
    const body = await req.json()
    const { content, role, senderName } = body as { content: string; role?: string; senderName?: string }

    if (!content?.trim()) return apiError('content is required', 400)

    // Allow admin role only for authenticated admins
    let effectiveRole = 'user'
    let effectiveSenderName = senderName ?? 'You'
    const authResult = await requireAuth(req)
    if (!('status' in authResult)) {
      if (authResult.user.role === 'admin') {
        effectiveRole = 'admin'
        effectiveSenderName = 'Support'
      } else {
        effectiveSenderName = authResult.user.name ?? senderName ?? 'You'
      }
    }

    const [msg] = await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      role: effectiveRole,
      senderName: effectiveSenderName,
      content: content.trim(),
    }).returning()

    // Bump session updatedAt
    await db.update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId))

    return apiOk(msg)
  } catch (err) {
    console.error('[chat messages POST]', err)
    return apiError('Failed to send message', 500)
  }
}
