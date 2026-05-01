import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq, ilike } from 'drizzle-orm'

async function main() {
  const phones = await db.select({ name: products.name, sku: products.sku, images: products.images }).from(products).where(eq(products.isActive, true))
  const apple = phones.filter(p => p.sku.startsWith('COM-APL-') || p.sku.startsWith('WEA-APL-'))
  const smartphoneCount = phones.filter(p => p.sku.startsWith('COM-')).length
  console.log(JSON.stringify({ activeProducts: phones.length, smartphoneCount, apple, last10Phones: phones.filter(p => p.sku.startsWith('COM-')).slice(-10) }, null, 2))
}
main().catch(e=>{console.error(e);process.exit(1)})
