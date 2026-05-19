import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { eq, ilike, gte, lte, and, asc, desc, sql, type SQL, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page      = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit     = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '12')))
  const category  = searchParams.get('category') ?? undefined
  const search    = searchParams.get('search')?.toLowerCase().trim()
  const minPrice  = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice  = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const featured  = searchParams.get('featured') === 'true'
  const isNew     = searchParams.get('isNew') === 'true'
  const sort      = searchParams.get('sort') ?? 'newest'

  const conditions: SQL[] = [eq(products.isActive, true)]

  if (category) {
    const [cat] = await db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1)
    if (cat?.id) {
      const children = await db.select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, cat.id))
      const categoryIds = [cat.id, ...children.map(c => c.id)]
      conditions.push(inArray(products.categoryId, categoryIds))
    } else {
      conditions.push(eq(products.categoryId, category))
    }
  }
  if (search) {
    conditions.push(ilike(products.name, `%${search}%`))
  }
  if (minPrice !== undefined) conditions.push(gte(products.price, String(minPrice)))
  if (maxPrice !== undefined) conditions.push(lte(products.price, String(maxPrice)))
  if (featured) conditions.push(eq(products.featured, true))
  if (isNew)    conditions.push(eq(products.isNew, true))

  const where = and(...conditions)

  const orderBy = sort === 'price_asc'  ? asc(products.price)
    : sort === 'price_desc' ? desc(products.price)
    : sort === 'rating'     ? desc(products.rating)
    : sort === 'popular'    ? desc(products.reviewCount)
    : desc(products.createdAt)

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(products).where(where)

  const data = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, shortDescription: products.shortDescription,
    specs: products.specs,
    price: products.price, comparePrice: products.comparePrice,
    images: products.images, categoryId: products.categoryId,
    stock: products.stock, sku: products.sku, rating: products.rating,
    reviewCount: products.reviewCount, tags: products.tags,
    featured: products.featured, isNew: products.isNew, isActive: products.isActive,
    createdAt: products.createdAt, updatedAt: products.updatedAt,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit)

  return apiOk({ data: data.map(withNumericPrices), total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

function withNumericPrices<T extends { price: unknown; comparePrice?: unknown; rating?: unknown }>(p: T) {
  return {
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    rating: p.rating ? Number(p.rating) : 0,
  }
}
