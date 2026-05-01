import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  const allCats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId, isActive: categories.isActive }).from(categories).where(eq(categories.isActive, true))
  const bySlug = new Map(allCats.map(c => [c.id, c.slug]))
  const childCount = allCats.filter(c => c.parentId).length
  const parentCount = allCats.filter(c => !c.parentId).length

  const rows = await db.select({
    product: products.name,
    sku: products.sku,
    categoryName: categories.name,
    categorySlug: categories.slug,
    parentId: categories.parentId,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.isActive, true))

  const unmapped = rows.filter(r => !r.categorySlug)
  const inParentOnly = rows.filter(r => r.categorySlug && !r.parentId)
  const withChild = rows.filter(r => r.categorySlug && !!r.parentId)

  const sampleDescriptions = await db.select({ name: products.name, description: products.description, shortDescription: products.shortDescription }).from(products).where(eq(products.isActive, true)).limit(3)

  console.log(JSON.stringify({
    activeCategories: allCats.length,
    parentCount,
    childCount,
    activeProducts: rows.length,
    unmapped: unmapped.length,
    mappedToParentOnly: inParentOnly.length,
    mappedToChild: withChild.length,
    sampleDescriptions,
  }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
