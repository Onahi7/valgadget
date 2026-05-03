import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

// All image fixes: broken URLs, logo placeholders, unreliable external CDNs
const FIXES: Array<{ sku: string; name: string; images: string[] }> = [
  {
    sku: 'SPT-SITUP-BAR',
    name: 'Doorway Sit-Up Bar',
    images: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    sku: 'PWR-ITE-20K',
    name: 'itel 20000mAh Fast Charge Power Bank',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    // Konga CDN — unreliable external domain
    sku: 'AUD-AMZ-FIRE4K',
    name: 'Amazon Fire TV Stick 4K',
    images: [
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    // Konga CDN — unreliable external domain
    sku: 'AUD-SNY-HTS40R',
    name: 'Sony HT-S40R Soundbar System',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    // Baseus CDN — external private domain
    sku: 'PWR-BAS-BIPOW10K',
    name: 'Baseus Bipow 10000mAh Power Bank',
    images: [
      'https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    // Anker Japan CDN — external private domain
    sku: 'PWR-ANK-PWRCORE20K',
    name: 'Anker PowerCore 20000mAh',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
    ],
  },
]

async function run() {
  let fixed = 0
  for (const fix of FIXES) {
    const result = await db
      .update(products)
      .set({ images: fix.images, updatedAt: new Date() })
      .where(eq(products.sku, fix.sku))
    fixed++
    console.log(`✓ Fixed [${fix.sku}] ${fix.name}`)
  }
  console.log(`\nFixed ${fixed} product images`)
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
