import { NextRequest } from 'next/server'
import { asc, eq, lte, sql } from 'drizzle-orm'
import { requireAuth, apiError, apiOk } from '@/lib/server/auth-helpers'
import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const rawThreshold = req.nextUrl.searchParams.get('threshold')
  const threshold = rawThreshold === null ? null : Number(rawThreshold)
  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0 || threshold > 100000)) {
    return apiError('Threshold must be a whole number between 0 and 100000.', 422)
  }

  try {
    const rows = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      stock: products.stock,
      lowStockThreshold: products.lowStockThreshold,
      price: products.price,
      comparePrice: products.comparePrice,
      cost: products.cost,
      images: products.images,
      categoryId: products.categoryId,
      category: { id: categories.id, name: categories.name, slug: categories.slug },
      condition: products.condition,
      brand: products.brand,
      isActive: products.isActive,
      updatedAt: products.updatedAt,
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(threshold === null
        ? sql`${products.stock} <= coalesce(${products.lowStockThreshold}, 5)`
        : lte(products.stock, threshold))
      .orderBy(asc(products.stock), asc(products.name))

    return apiOk(rows.map(row => ({
      ...row,
      price: Number(row.price),
      comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
      cost: row.cost ? Number(row.cost) : undefined,
      images: row.images ?? [],
      category: row.category?.id ? row.category : undefined,
    })))
  } catch (error) {
    console.error('[admin low stock]', error)
    return apiError('Failed to load low-stock products.', 500)
  }
}
