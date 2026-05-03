import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function main(){
  const rows = await db.select({ name: products.name, sku: products.sku, images: products.images }).from(products).where(eq(products.isActive, true))
  const generic = rows.filter(r => (r.images?.[0] || '').includes('source.unsplash.com'))
  console.log(JSON.stringify(generic, null, 2))
}
main().catch(e=>{console.error(e);process.exit(1)})
