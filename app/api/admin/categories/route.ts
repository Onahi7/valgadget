import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const data = await db.select().from(categories).orderBy(desc(categories.sortOrder))
  return apiOk(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { name, description, image, icon, parentId, isActive = true, sortOrder = 0 } = body
    if (!name) return apiError('name is required.')

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const result = await db.insert(categories).values({ name, slug, description, image, icon, parentId, isActive, sortOrder }).returning()
    const cat = (result as unknown as any[])?.[0]
    return apiOk(cat, 201)
  } catch (err) {
    console.error('[admin create category]', err)
    return apiError('Failed to create category.', 500)
  }
}
