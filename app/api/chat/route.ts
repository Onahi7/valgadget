/**
 * GET  /api/chat              — list sessions (admin)
 * POST /api/chat              — create a new chat session
 */
import { NextRequest } from 'next/server'
import { db, withDbRetry } from '@/lib/server/db'
import { chatSessions, users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, rateLimitPresets, getRateLimitKey } from '@/lib/server/rate-limiter'
import { desc, eq } from 'drizzle-orm'
import { createGuestChatToken } from '@/lib/server/chat-access'

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(getRateLimitKey(req), rateLimitPresets.chat)
    if (!rl.success) return apiRateLimited(rl.resetAt)

    const body = await req.json()
    const { subject, guestName, guestEmail, productId } = body as {
      subject?: string; guestName?: string; guestEmail?: string; productId?: string
    }

    // Sanitize inputs
    const sanitizedSubject = subject?.trim().slice(0, 500) ?? null
    const sanitizedGuestName = guestName?.trim().slice(0, 200) ?? null

    // Optionally get logged-in user
    let userId: string | undefined
    const authResult = await requireAuth(req)
    if (!('status' in authResult)) {
      userId = authResult.user.sub
    }

    const normalizedEmail = guestEmail?.trim().toLowerCase().slice(0, 255) ?? null
    if (!userId && !normalizedEmail) return apiError('guestEmail required for guest chat', 400)
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return apiError('Enter a valid email address', 400)
    }

    const [session] = await db.insert(chatSessions).values({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      guestName: sanitizedGuestName,
      guestEmail: normalizedEmail,
      subject: sanitizedSubject,
      productId: productId ?? null,
    }).returning()

    return apiOk({
      ...session,
      ...(!userId && session.guestEmail ? { guestAccessToken: createGuestChatToken(session.id, session.guestEmail) } : {}),
    })
  } catch {
    return apiError('Failed to create chat session', 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth
    if (auth.user.role !== 'admin') return apiError('Forbidden', 403)

    const sessions = await withDbRetry(() => db
      .select({
        id: chatSessions.id,
        userId: chatSessions.userId,
        guestName: chatSessions.guestName,
        guestEmail: chatSessions.guestEmail,
        subject: chatSessions.subject,
        productId: chatSessions.productId,
        status: chatSessions.status,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(chatSessions)
      .leftJoin(users, eq(chatSessions.userId, users.id))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(100))

    return apiOk(sessions)
  } catch {
    return apiError('Failed to load chat sessions', 500)
  }
}
