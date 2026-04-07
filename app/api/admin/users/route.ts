import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, ilike, eq, sql, and, type SQL } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const role   = searchParams.get('role') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const conditions: SQL[] = []
  if (role)   conditions.push(eq(users.role, role))
  if (search) conditions.push(ilike(users.name, `%${search}%`))

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(where)

  const data = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    avatar: users.avatar, phone: users.phone, isVerified: users.isVerified,
    affiliateCode: users.affiliateCode, createdAt: users.createdAt, updatedAt: users.updatedAt,
  }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset((page - 1) * limit)

  return apiOk({ data, total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}
