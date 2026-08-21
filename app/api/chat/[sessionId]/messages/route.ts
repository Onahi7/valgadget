/**
 * GET  /api/chat/[sessionId]/messages  — fetch messages for a session
 * POST /api/chat/[sessionId]/messages  — send a message
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { chatMessages, chatSessions } from '@/lib/server/schema'
import { getRequestUser, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { eq, asc } from 'drizzle-orm'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'
import { verifyGuestChatToken } from '@/lib/server/chat-access'

type Ctx = { params: Promise<{ sessionId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getRequestUser(req)

    const { sessionId } = await ctx.params

    // Verify user owns the session or is admin
    const [session] = await db
      .select({ userId: chatSessions.userId, guestEmail: chatSessions.guestEmail })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1)

    if (!session) return apiError('Session not found', 404)
    if (!canAccessSession(req, session, user)) return apiError('Forbidden', 403)

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
    const user = await getRequestUser(req)

    // Rate limit chat messages
    const rl = rateLimit(getRateLimitKey(req), rateLimitPresets.chat)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const { sessionId } = await ctx.params
    const body = await req.json()
    const { content, senderName } = body as { content: string; senderName?: string }

    if (!content?.trim()) return apiError('content is required', 400)

    // Verify user owns the session or is admin
    const [session] = await db
      .select({ userId: chatSessions.userId, guestEmail: chatSessions.guestEmail, status: chatSessions.status })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1)

    if (!session) return apiError('Session not found', 404)
    if (session.status === 'closed') return apiError('This chat session is closed', 400)
    if (!canAccessSession(req, session, user)) return apiError('Forbidden', 403)

    // Allow admin role only for authenticated admins
    let effectiveRole = 'user'
    let effectiveSenderName = senderName ?? 'You'
    if (user?.role === 'admin') {
      effectiveRole = 'admin'
      effectiveSenderName = 'Support'
    } else {
      effectiveSenderName = user?.name ?? senderName ?? 'You'
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

function canAccessSession(
  req: NextRequest,
  session: { userId: string | null; guestEmail: string | null },
  user: Awaited<ReturnType<typeof getRequestUser>>,
) {
  if (user?.role === 'admin') return true
  if (session.userId) return user?.sub === session.userId
  const token = req.headers.get('x-chat-access-token') ?? new URL(req.url).searchParams.get('accessToken') ?? ''
  return Boolean(session.guestEmail && verifyGuestChatToken(session.userId ?? new URL(req.url).pathname.split('/')[3] ?? '', session.guestEmail, token))
}
