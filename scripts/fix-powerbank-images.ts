import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function run() {
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-BAS-BIPOW10K'))
  console.log('✓ Fixed Baseus Bipow image')

  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-ITE-20K'))
  console.log('✓ Fixed itel power bank image')

  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-ANK-PWRCORE20K'))
  console.log('✓ Fixed Anker PowerCore image')

  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
