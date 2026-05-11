import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, desc, sql, and, type SQL } from 'drizzle-orm'

// GET /api/admin/products — list with pagination
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products)
  const data = await db.select().from(products)
    .orderBy(desc(products.createdAt)).limit(limit).offset((page - 1) * limit)

  return apiOk({ data: data.map(numericProduct), total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

// POST /api/admin/products — create
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { name, description = '', shortDescription, specs = [], price, comparePrice, cost, categoryId,
            stock = 0, sku, tags = [], featured = false, isNew = false,
            isActive = true, images = [] } = body

    if (!name || !price || !sku) return apiError('name, price, and sku are required.')

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const [product] = await db.insert(products).values({
      name, slug, description, shortDescription, specs,
      price: String(price), comparePrice: comparePrice ? String(comparePrice) : null,
      cost: cost ? String(cost) : null,
      categoryId, stock, sku, tags, featured, isNew, isActive, images,
    }).returning()

    return apiOk(numericProduct(product), 201)
  } catch (err) {
    console.error('[admin create product]', err)
    return apiError('Failed to create product.', 500)
  }
}

function numericProduct(p: typeof products.$inferSelect) {
  return { ...p, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined, rating: Number(p.rating) }
}
