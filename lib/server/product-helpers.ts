import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { categories, products } from '@/lib/server/schema'
import type { Product } from '@/lib/services/product.service'

/**
 * Shared Drizzle select object for product queries.
 * Used by homepage, shop page, and any other server-side product fetches.
 */
export const productSelection = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  description: products.description,
  shortDescription: products.shortDescription,
  specs: products.specs,
  price: products.price,
  comparePrice: products.comparePrice,
  images: products.images,
  categoryId: products.categoryId,
  stock: products.stock,
  sku: products.sku,
  rating: products.rating,
  reviewCount: products.reviewCount,
  tags: products.tags,
  condition: products.condition,
  featured: products.featured,
  isNew: products.isNew,
  isActive: products.isActive,
  brand: products.brand,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  category: { id: categories.id, name: categories.name, slug: categories.slug },
}

/** Only allow local paths and ImageKit URLs. External hotlinks are blocked. */
export function isDisplayableImage(src?: string | null): boolean {
  if (!src) return false
  return src.startsWith('/') || src.includes('ik.imagekit.io')
}

/** Return usable images, falling back to the placeholder SVG. */
export function displayImages(images?: string[] | null): string[] {
  const usable = (images ?? []).filter(isDisplayableImage)
  return usable.length ? usable : ['/placeholder-product.svg']
}

/** Normalize a raw Drizzle row into a Product object. */
export function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    ...row,
    price: Number(row.price),
    comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
    rating: row.rating ? Number(row.rating) : 0,
    categoryId: (row.categoryId as string) ?? '',
    tags: (row.tags as string[]) ?? [],
    images: displayImages(row.images as string[] | null),
    specs: (row.specs as Product['specs']) ?? [],
    brand: (row.brand as string) ?? undefined,
    condition: (row.condition as Product['condition']) ?? 'brand-new',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  } as Product
}

type DrizzleWhere = ReturnType<typeof and>
type DrizzleOrderBy = ReturnType<typeof desc> | ReturnType<typeof asc>

/** Shared product query helper — selects, joins, normalizes. */
export async function getProducts({
  where,
  orderBy,
  limit = 8,
}: {
  where?: DrizzleWhere
  orderBy: DrizzleOrderBy
  limit?: number
}) {
  const rows = await db
    .select(productSelection)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where ?? eq(products.isActive, true))
    .orderBy(orderBy)
    .limit(limit)

  return rows.map(normalizeProduct)
}
