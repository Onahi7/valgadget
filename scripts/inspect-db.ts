import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'
import { sql, eq } from 'drizzle-orm'

async function main() {
  const [{ c: catCount }] = await db.select({ c: sql<number>`count(*)::int` }).from(categories)
  const [{ c: prodCount }] = await db.select({ c: sql<number>`count(*)::int` }).from(products)
  const [{ c: activeCatCount }] = await db.select({ c: sql<number>`count(*)::int` }).from(categories).where(eq(categories.isActive, true))
  const [{ c: activeProdCount }] = await db.select({ c: sql<number>`count(*)::int` }).from(products).where(eq(products.isActive, true))
  const cats = await db.select({ name: categories.name, slug: categories.slug, isActive: categories.isActive }).from(categories).orderBy(categories.sortOrder)
  const prods = await db.select({ name: products.name, sku: products.sku, images: products.images, isActive: products.isActive }).from(products).where(eq(products.isActive, true)).limit(12)
  console.log(JSON.stringify({ catCount, prodCount, activeCatCount, activeProdCount, cats, prods }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
