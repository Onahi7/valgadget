import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories } from '@/lib/server/schema'
import { ok, fail } from '@/lib/server/http'
import { eq, and, ne, desc } from 'drizzle-orm'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const limit = Math.min(12, Math.max(1, Number(new URL(request.url).searchParams.get('limit') ?? '6')))

  // Find base product's category
  const [base] = await db.select({ categoryId: products.categoryId })
    .from(products).where(eq(products.id, id)).limit(1)
  if (!base) return fail('Product not found.', 404)

  const data = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    price: products.price, comparePrice: products.comparePrice,
    images: products.images, stock: products.stock, sku: products.sku,
    rating: products.rating, reviewCount: products.reviewCount,
    featured: products.featured, isNew: products.isNew, categoryId: products.categoryId,
    category: { id: categories.id, name: categories.name, slug: categories.slug },
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.categoryId, base.categoryId!), ne(products.id, id), eq(products.isActive, true)))
    .orderBy(desc(products.rating))
    .limit(limit)

  return ok(data.map(p => ({ ...p, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined, rating: Number(p.rating) })))
}
