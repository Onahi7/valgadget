import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, desc, sql, and, type SQL, ilike } from 'drizzle-orm'

// GET /api/admin/products — list with pagination
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  const search = searchParams.get('search')?.trim()
  const category = searchParams.get('category') ?? undefined
  const active = searchParams.get('isActive')

  const conditions: SQL[] = []
  if (search) {
    conditions.push(sql`(${products.name} ilike ${`%${search}%`} or ${products.sku} ilike ${`%${search}%`})`)
  }
  if (category) conditions.push(eq(products.categoryId, category))
  if (active === 'true') conditions.push(eq(products.isActive, true))
  if (active === 'false') conditions.push(eq(products.isActive, false))

  const where = conditions.length ? and(...conditions) : undefined

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(where)
  const data = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
    shortDescription: products.shortDescription,
    specs: products.specs,
    price: products.price,
    comparePrice: products.comparePrice,
    cost: products.cost,
    images: products.images,
    categoryId: products.categoryId,
    stock: products.stock,
    lowStockThreshold: products.lowStockThreshold,
    sku: products.sku,
    rating: products.rating,
    reviewCount: products.reviewCount,
    tags: products.tags,
    featured: products.featured,
    isNew: products.isNew,
    isActive: products.isActive,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  }).from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
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
