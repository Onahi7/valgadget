import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { products, categories, productVariants } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, desc, sql, and, type SQL } from 'drizzle-orm'
import {
  createAdminProductSchema,
  nullableValue,
  postgresErrorCode,
  slugifyProductName,
  validationErrors,
  withConditionTag,
} from '@/lib/server/admin-product'

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

  const countQuery = db.select({ count: sql<number>`count(*)::int` }).from(products).where(where)
  const dataQuery = db.select({
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
    condition: products.condition,
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

  const [[{ count }], data] = await Promise.all([countQuery, dataQuery])

  return apiOk({ data: data.map(numericProduct), total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) })
}

// POST /api/admin/products — create
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const parsed = createAdminProductSchema.safeParse(await req.json())
    if (!parsed.success) return apiError('Please correct the highlighted product fields.', 422, validationErrors(parsed.error))

    const input = parsed.data
    if (input.categoryId) {
      const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).limit(1)
      if (!category) return apiError('Selected category does not exist.', 422, { categoryId: ['Select a valid category.'] })
    }

    const slug = `${slugifyProductName(input.name)}-${Date.now().toString(36)}`
    const variantStock = input.variants.filter(variant => variant.isActive).reduce((sum, variant) => sum + variant.stock, 0)

    const product = await db.transaction(async tx => {
      const [created] = await tx.insert(products).values({
        name: input.name,
        slug,
        description: input.description,
        shortDescription: nullableValue(input.shortDescription),
        specs: input.specs,
        price: String(input.price),
        comparePrice: input.comparePrice ? String(input.comparePrice) : null,
        cost: input.cost !== undefined && input.cost !== null ? String(input.cost) : null,
        categoryId: nullableValue(input.categoryId),
        stock: input.variants.length > 0 ? variantStock : input.stock,
        lowStockThreshold: input.lowStockThreshold,
        sku: input.sku,
        barcode: nullableValue(input.barcode),
        brand: nullableValue(input.brand),
        tags: withConditionTag(input.tags, input.condition),
        condition: input.condition,
        featured: input.featured,
        isNew: input.isNew,
        isActive: input.isActive,
        images: input.images,
      }).returning()

      if (input.variants.length > 0) {
        await tx.insert(productVariants).values(input.variants.map((variant, index) => ({
          productId: created.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price ? String(variant.price) : null,
          stock: variant.stock,
          attributes: variant.attributes,
          image: nullableValue(variant.image),
          isActive: variant.isActive,
          sortOrder: index,
        })))
      }

      return created
    })

    return apiOk({ ...numericProduct(product), variants: input.variants }, 201)
  } catch (err) {
    console.error('[admin create product]', err)
    if (postgresErrorCode(err) === '23505') return apiError('A product or variant already uses that SKU.', 409)
    return apiError('Failed to create product.', 500)
  }
}

function numericProduct(p: Record<string, unknown>) {
  const images = Array.isArray(p.images) ? p.images.filter((src): src is string => typeof src === 'string') : []
  const displayImage = images.find(src => !src.includes('source.unsplash.com')) ?? null

  return {
    ...p,
    images,
    displayImage,
    imageStatus: displayImage ? 'ready' : 'needs_image',
    price: p.price ? Number(p.price) : undefined,
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    cost: p.cost ? Number(p.cost) : undefined,
    rating: p.rating ? Number(p.rating) : 0,
  }
}
