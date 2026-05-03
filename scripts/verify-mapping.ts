import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products, categories } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const rows = await db.select({
    name: products.name,
    sku: products.sku,
    productActive: products.isActive,
    categoryId: products.categoryId,
    categoryName: categories.name,
    categorySlug: categories.slug,
    categoryActive: categories.isActive,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.isActive, true))

  const missingCategory = rows.filter(r => !r.categoryId)
  const inactiveCategory = rows.filter(r => r.categoryId && !r.categoryActive)
  const byCategory = rows.reduce((acc, r) => {
    const k = r.categorySlug || 'NO_CATEGORY'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(JSON.stringify({ totalActiveProducts: rows.length, missingCategory: missingCategory.length, inactiveCategory: inactiveCategory.length, byCategory, sample: rows.slice(0, 20) }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
