import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products, categories } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const rows = await db.select({ sku: products.sku, categorySlug: categories.slug, parentId: categories.parentId, description: products.description }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.isActive, true))
  const mappedToChild = rows.filter(r => !!r.parentId).length
  const mappedToParent = rows.filter(r => !r.parentId).length
  const longDesc = rows.filter(r => (r.description || '').length > 120).length
  console.log(JSON.stringify({ activeProducts: rows.length, mappedToChild, mappedToParent, longDescriptions: longDesc }, null, 2))
}
main().catch(e=>{console.error(e);process.exit(1)})
