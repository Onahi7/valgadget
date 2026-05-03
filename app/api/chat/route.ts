/**
 * GET  /api/chat              — list sessions (admin)
 * POST /api/chat              — create a new chat session
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { chatSessions, chatMessages } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, guestName, guestEmail, productId } = body as {
      subject?: string; guestName?: string; guestEmail?: string; productId?: string
    }

    // Optionally get logged-in user
    let userId: string | undefined
    const authResult = await requireAuth(req)
    if (!('status' in authResult)) {
      userId = authResult.user.sub
    }

    if (!userId && !guestEmail) return apiError('guestEmail required for guest chat', 400)

    const [session] = await db.insert(chatSessions).values({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      guestName: guestName ?? null,
      guestEmail: guestEmail ?? null,
      subject: subject ?? null,
      productId: productId ?? null,
    }).returning()

    return apiOk(session)
  } catch (err) {
    console.error('[chat POST]', err)
    return apiError('Failed to create chat session', 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ('status' in auth) return auth
    if (auth.user.role !== 'admin') return apiError('Forbidden', 403)

    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt))
      .limit(100)

    return apiOk(sessions)
  } catch (err) {
    console.error('[chat GET]', err)
    return apiError('Unauthorized', 401)
  }
}
