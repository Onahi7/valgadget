import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { wishlists, products } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { and, desc, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const data = await db.select({
    id: wishlists.id,
    productId: wishlists.productId,
    addedAt: wishlists.createdAt,
    product: {
      id: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      price: products.price,
      comparePrice: products.comparePrice,
      stock: products.stock,
      sku: products.sku,
      rating: products.rating,
      reviewCount: products.reviewCount,
      description: products.description,
      shortDescription: products.shortDescription,
      categoryId: products.categoryId,
      tags: products.tags,
      featured: products.featured,
      isNew: products.isNew,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    },
  })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.userId, auth.user.sub))
    .orderBy(desc(wishlists.createdAt))

  return apiOk(data.map(i => ({
    ...i,
    product: {
      ...i.product,
      price: Number(i.product.price),
      comparePrice: i.product.comparePrice ? Number(i.product.comparePrice) : undefined,
      rating: Number(i.product.rating ?? 0),
    },
  })))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  const { productId } = await req.json().catch(() => ({})) as { productId?: string }
  if (!productId) return apiError('productId is required', 400)

  const [existing] = await db.select().from(wishlists)
    .where(and(eq(wishlists.userId, auth.user.sub), eq(wishlists.productId, productId)))
    .limit(1)

  if (!existing) {
    await db.insert(wishlists).values({ userId: auth.user.sub, productId })
  }

  const [item] = await db.select({
    id: wishlists.id,
    productId: wishlists.productId,
    addedAt: wishlists.createdAt,
    product: {
      id: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      price: products.price,
      comparePrice: products.comparePrice,
      stock: products.stock,
      sku: products.sku,
      rating: products.rating,
      reviewCount: products.reviewCount,
      description: products.description,
      shortDescription: products.shortDescription,
      categoryId: products.categoryId,
      tags: products.tags,
      featured: products.featured,
      isNew: products.isNew,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    },
  })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(and(eq(wishlists.userId, auth.user.sub), eq(wishlists.productId, productId)))
    .limit(1)

  if (!item) return apiError('Failed to add wishlist item', 500)

  return apiOk({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
      comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : undefined,
      rating: Number(item.product.rating ?? 0),
    },
  }, 201)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  await db.delete(wishlists).where(eq(wishlists.userId, auth.user.sub))
  return apiOk({ message: 'Wishlist cleared.' })
}
