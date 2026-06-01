import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { apiOk } from '@/lib/server/auth-helpers'
import { eq, sql, and, gte, lte, type SQL, inArray } from 'drizzle-orm'

/**
 * GET /api/products/facets
 * Returns the available filter values (brands, price range, category counts)
 * scoped by the current category filter. This powers the faceted filter
 * sidebar on the shop page.
 *
 * Query params: category (slug)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? undefined

  // Resolve category → product filter (parent + children)
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
      const ids = [cat.id, ...children.map(c => c.id)]
      conditions.push(inArray(products.categoryId, ids))
    } else {
      conditions.push(eq(products.categoryId, category))
    }
  }

  const where = and(...conditions)

  const [brandRows, priceAgg, inStockCount, totalCount, tagRows] = await Promise.all([
    // Brand counts
    db
      .select({
        brand: products.brand,
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(and(where, sql`${products.brand} IS NOT NULL`))
      .groupBy(products.brand)
      .orderBy(sql`count(*) desc`),
    // Min/max price
    db
      .select({
        min: sql<number>`coalesce(min(price), 0)::int`,
        max: sql<number>`coalesce(max(price), 0)::int`,
      })
      .from(products)
      .where(where),
    // In-stock count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(where, gte(products.stock, 1))),
    // Total
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
    // Top tags (split json array)
    db
      .select({
        tag: sql<string>`json_array_elements_text(${products.tags})`,
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(where)
      .groupBy(sql`json_array_elements_text(${products.tags})`)
      .orderBy(sql`count(*) desc`)
      .limit(20),
  ])

  return apiOk({
    brands: brandRows
      .filter(r => r.brand)
      .map(r => ({ value: r.brand!, count: Number(r.count) })),
    priceRange: {
      min: Number(priceAgg[0]?.min ?? 0),
      max: Number(priceAgg[0]?.max ?? 0),
    },
    availability: {
      inStock: Number(inStockCount[0]?.count ?? 0),
      outOfStock: Number(totalCount[0]?.count ?? 0) - Number(inStockCount[0]?.count ?? 0),
      total: Number(totalCount[0]?.count ?? 0),
    },
    tags: tagRows.map(r => ({ value: r.tag, count: Number(r.count) })),
  })
}
