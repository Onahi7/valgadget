/**
 * Backfill the products.brand column by extracting brand names from the
 * product name (first word) or from a known brand list matched against
 * the name + tags.
 *
 * Run with: pnpm tsx scripts/backfill-brands.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { sql, isNull, or } from 'drizzle-orm'

// Known brands. Match is case-insensitive on the first word of the name
// OR as a substring in the name or any tag.
const KNOWN_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'JBL',
  'Zealot',
  'Andrack',
  'JYSUPER',
  'Soundcore',
  'Harman Kardon',
  'Ecoflow',
  'Sony',
  'LG',
  'HP',
  'Dell',
  'Lenovo',
  'Asus',
  'Acer',
  'Microsoft',
  'Huawei',
  'Google',
  'OnePlus',
  'Nokia',
  'Motorola',
  'Oppo',
  'Vivo',
  'Realme',
  'Tecno',
  'Infinix',
  'Itel',
  'Homework',
  'Colarsolar',
  'Ninja',
  'Philips',
  'Russell Hobbs',
  'Canon',
  'Epson',
  'Bose',
  'Sennheiser',
  'Beats',
  'Skullcandy',
  'Jabra',
  'Logitech',
  'Razer',
  'Corsair',
  'Kingston',
  'Sandisk',
  'Crucial',
  'WD',
  'Seagate',
  'TP-Link',
  'D-Link',
  'Netgear',
  'Hisense',
  'TCL',
  'Skyworth',
  'Panasonic',
  'Toshiba',
  'Sharp',
]

function extractBrand(name: string, tags: string[]): string | null {
  const firstWord = name.split(/\s+/)[0]?.toLowerCase() ?? ''
  for (const brand of KNOWN_BRANDS) {
    const brandLower = brand.toLowerCase()
    // First-word match (e.g. "JBL Studio 8" -> "JBL")
    if (firstWord === brandLower) return brand
    // Multi-word brands: full substring match
    if (brand.includes(' ') && name.toLowerCase().includes(brandLower)) return brand
  }
  // Fallback: any tag that exactly matches a known brand
  for (const tag of tags) {
    const tagLower = tag.toLowerCase()
    for (const brand of KNOWN_BRANDS) {
      if (brand.toLowerCase() === tagLower) return brand
    }
  }
  return null
}

async function run() {
  const rows = await db
    .select({ id: products.id, name: products.name, tags: products.tags })
    .from(products)
  let updated = 0
  for (const row of rows) {
    const brand = extractBrand(row.name, row.tags ?? [])
    if (brand) {
      await db
        .update(products)
        .set({ brand, updatedAt: new Date() })
        .where(sql`id = ${row.id}`)
      updated++
    }
  }
  console.log(`Backfilled ${updated} of ${rows.length} products with brand`)
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
