import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const rows = await db.select({ name: products.name, sku: products.sku, images: products.images }).from(products).where(eq(products.isActive, true))
  const generic = rows.filter(r => (r.images?.[0] || '').includes('source.unsplash.com'))
  const nonNigerian = rows.filter(r => {
    const u = (r.images?.[0] || '').toLowerCase()
    return !(u.includes('ng.jumia.is') || u.includes('anker') || u.includes('baseus') || u.includes('oraimo') || u.includes('jumia'))
  })
  console.log(JSON.stringify({ activeProducts: rows.length, genericCount: generic.length, generic, nonNigerianCount: nonNigerian.length, sample: rows.slice(0, 20) }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
