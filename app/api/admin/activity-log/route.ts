import { NextRequest } from 'next/server'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { db } from '@/lib/server/db'
import { adminActivityLogs, users } from '@/lib/server/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)))
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(adminActivityLogs)
    const data = await db.select({
      id: adminActivityLogs.id,
      action: adminActivityLogs.action,
      entityType: adminActivityLogs.entityType,
      entityId: adminActivityLogs.entityId,
      userId: adminActivityLogs.adminId,
      userName: users.name,
      details: adminActivityLogs.details,
      createdAt: adminActivityLogs.createdAt,
    }).from(adminActivityLogs)
      .leftJoin(users, eq(adminActivityLogs.adminId, users.id))
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return apiOk({ data: data.map(row => ({ ...row, userName: row.userName ?? 'System' })), total: count, page, limit })
  } catch (error) {
    console.error('[activity log GET]', error)
    return apiError('Failed to load activity log.', 500)
  }
}
