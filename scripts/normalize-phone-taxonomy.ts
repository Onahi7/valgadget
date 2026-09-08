import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { and, eq } from 'drizzle-orm'
import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'
import { buildCategoryTree, flattenCategoryTree } from '../lib/category-hierarchy'

type CategoryRow = typeof categories.$inferSelect

const apply = process.argv.includes('--apply')

const desiredCategories = [
  { slug: 'phones', name: 'Phones', parentSlug: null, sortOrder: 10, isActive: true },
  { slug: 'iphones', name: 'iPhones', parentSlug: 'phones', sortOrder: 10, isActive: true },
  { slug: 'iphones-brand-new', name: 'Brand New', parentSlug: 'iphones', sortOrder: 10, isActive: true },
  { slug: 'iphones-uk-used', name: 'UK Used', parentSlug: 'iphones', sortOrder: 20, isActive: true },
  { slug: 'samsung-phones', name: 'Samsung', parentSlug: 'phones', sortOrder: 20, isActive: true },
  { slug: 'samsung-phones-brand-new', name: 'Brand New', parentSlug: 'samsung-phones', sortOrder: 10, isActive: true },
  { slug: 'samsung-phones-uk-used', name: 'UK Used', parentSlug: 'samsung-phones', sortOrder: 20, isActive: true },
  { slug: 'google-pixel', name: 'Google Pixel', parentSlug: 'phones', sortOrder: 30, isActive: true },
  { slug: 'google-pixel-brand-new', name: 'Brand New', parentSlug: 'google-pixel', sortOrder: 10, isActive: true },
  { slug: 'google-pixel-uk-used', name: 'UK Used', parentSlug: 'google-pixel', sortOrder: 20, isActive: true },
  { slug: 'android-phones', name: 'Android Phones', parentSlug: 'phones', sortOrder: 40, isActive: true },
  { slug: 'android-tablets', name: 'Tablets', parentSlug: null, sortOrder: 20, isActive: true },
] as const

const legacyCategories = [
  { slug: 'android-phones-tablets', name: 'Android Phones & Tablets (Legacy)' },
  { slug: 'smartphones-tablets', name: 'Smartphones & Tablets (Legacy)' },
] as const

function destinationSlug(product: { name: string; brand: string | null; condition: string | null }) {
  const name = product.name.toLowerCase()
  const brand = (product.brand ?? '').toLowerCase()
  const used = product.condition === 'uk-used'

  if (brand === 'apple' || name.includes('iphone')) return used ? 'iphones-uk-used' : 'iphones-brand-new'
  if (brand === 'samsung' || name.includes('samsung')) return used ? 'samsung-phones-uk-used' : 'samsung-phones-brand-new'
  if (brand === 'google' || name.includes('pixel')) return used ? 'google-pixel-uk-used' : 'google-pixel-brand-new'
  if (['redmi', 'xiaomi', 'infinix', 'tecno', 'itel'].some(value => brand === value || name.includes(value))) return 'android-phones'
  return null
}

function isClearlyNotAPhone(name: string) {
  return /\b(tablet|pad|tab|laptop|monitor|watch|buds|headphones?|speaker)\b/i.test(name)
}

async function main() {
  const [existingCategories, existingProducts] = await Promise.all([
    db.select().from(categories),
    db.select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      condition: products.condition,
      categoryId: products.categoryId,
      isActive: products.isActive,
    }).from(products),
  ])
  const existingBySlug = new Map(existingCategories.map(category => [category.slug, category]))
  const categoryById = new Map(existingCategories.map(category => [category.id, category]))
  const phoneRelatedCategoryIds = new Set(existingCategories
    .filter(category => /iphone|smartphone|android.*phone|mobile.*phone|^phones?$/.test(category.slug))
    .map(category => category.id))

  const productMoves = existingProducts.flatMap(product => {
    if (isClearlyNotAPhone(product.name)) return []
    const targetSlug = destinationSlug(product)
    if (!targetSlug) return []
    const current = product.categoryId ? categoryById.get(product.categoryId) : undefined
    const isPhoneContext = !current || phoneRelatedCategoryIds.has(current.id) || /phone|iphone|smartphone/.test(current.slug)
    if (!isPhoneContext || current?.slug === targetSlug) return []
    return [{ id: product.id, name: product.name, from: current?.slug ?? 'uncategorized', targetSlug }]
  })

  const categoryPlan = [
    ...desiredCategories.map(category => ({
      ...category,
      action: existingBySlug.has(category.slug) ? 'update' : 'create',
    })),
    ...legacyCategories
      .filter(category => existingBySlug.has(category.slug))
      .map(category => ({ ...category, action: 'deactivate' as const })),
  ]

  const currentPhonePaths = flattenCategoryTree(buildCategoryTree(existingCategories))
    .filter(category => category.path[0] === 'Phones')
    .map(category => category.path.join(' → '))

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', currentPhonePaths, categoryPlan, productMoves }, null, 2))
  if (!apply) return

  await db.transaction(async tx => {
    const bySlug = new Map<string, CategoryRow>(existingCategories.map(category => [category.slug, category]))

    for (const desired of desiredCategories) {
      const parentId = desired.parentSlug ? bySlug.get(desired.parentSlug)?.id : null
      if (desired.parentSlug && !parentId) throw new Error(`Missing parent category: ${desired.parentSlug}`)

      const current = bySlug.get(desired.slug)
      if (current) {
        const [updated] = await tx.update(categories).set({
          name: desired.name,
          parentId,
          sortOrder: desired.sortOrder,
          isActive: desired.isActive,
          updatedAt: new Date(),
        }).where(eq(categories.id, current.id)).returning()
        bySlug.set(desired.slug, updated)
      } else {
        const [created] = await tx.insert(categories).values({
          name: desired.name,
          slug: desired.slug,
          parentId,
          sortOrder: desired.sortOrder,
          isActive: desired.isActive,
        }).returning()
        bySlug.set(desired.slug, created)
      }
    }

    for (const legacy of legacyCategories) {
      const current = bySlug.get(legacy.slug)
      if (!current) continue
      await tx.update(categories).set({
        name: legacy.name,
        isActive: false,
        updatedAt: new Date(),
      }).where(eq(categories.id, current.id))
    }

    for (const move of productMoves) {
      const target = bySlug.get(move.targetSlug)
      if (!target) throw new Error(`Missing product destination: ${move.targetSlug}`)
      await tx.update(products).set({ categoryId: target.id, updatedAt: new Date() })
        .where(and(eq(products.id, move.id), eq(products.isActive, true)))
    }
  })

  const verifiedCategories = await db.select().from(categories)
  const verifiedPaths = flattenCategoryTree(buildCategoryTree(verifiedCategories))
    .filter(category => category.path[0] === 'Phones')
    .map(category => category.path.join(' → '))
  console.log(JSON.stringify({ applied: true, movedProducts: productMoves.length, verifiedPaths }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
