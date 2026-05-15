/**
 * GET  /api/chat/[sessionId]/messages  — fetch messages for a session
 * POST /api/chat/[sessionId]/messages  — send a message
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { chatMessages, chatSessions } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { eq, asc, and } from 'drizzle-orm'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'

type Ctx = { params: Promise<{ sessionId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth

    const { sessionId } = await ctx.params

    // Verify user owns the session or is admin
    const [session] = await db
      .select({ userId: chatSessions.userId })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1)

    if (!session) return apiError('Session not found', 404)
    if (session.userId && session.userId !== auth.user.sub && auth.user.role !== 'admin') {
      return apiError('Forbidden', 403)
    }

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
    const auth = await requireAuth(req)
    if ('status' in auth) return auth

    // Rate limit chat messages
    const rl = rateLimit(getRateLimitKey(req), rateLimitPresets.chat)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const { sessionId } = await ctx.params
    const body = await req.json()
    const { content, senderName } = body as { content: string; senderName?: string }

    if (!content?.trim()) return apiError('content is required', 400)

    // Verify user owns the session or is admin
    const [session] = await db
      .select({ userId: chatSessions.userId, status: chatSessions.status })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1)

    if (!session) return apiError('Session not found', 404)
    if (session.status === 'closed') return apiError('This chat session is closed', 400)
    if (session.userId && session.userId !== auth.user.sub && auth.user.role !== 'admin') {
      return apiError('Forbidden', 403)
    }

    // Allow admin role only for authenticated admins
    let effectiveRole = 'user'
    let effectiveSenderName = senderName ?? 'You'
    if (auth.user.role === 'admin') {
      effectiveRole = 'admin'
      effectiveSenderName = 'Support'
    } else {
      effectiveSenderName = auth.user.name ?? senderName ?? 'You'
    }

    const [msg] = await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      role: effectiveRole,
      senderName: effectiveSenderName,
      content: content.trim().slice(0, 5000),
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
