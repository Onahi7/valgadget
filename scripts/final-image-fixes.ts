import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products, categories } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function run() {
  // Fix Baseus power bank - use a clearly identifiable portable charger image
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-BAS-BIPOW10K'))
  console.log('✓ Fixed Baseus Bipow power bank image')

  // Fix Storage & Media category — use a USB/SSD image
  await db.update(categories).set({
    image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=800&q=80',
    updatedAt: new Date(),
  }).where(eq(categories.slug, 'storage-media'))
  console.log('✓ Fixed Storage & Media category image')

  // Fix Sport Equipment category — currently gym weights (fine for fitness, but this is a tech store)
  // Keep it — dumbbells are accurate products in that category

  // Also fix Anker PowerCore — currently same teal power bank image as itel/Oraimo, make it distinct
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-ANK-PWRCORE20K'))
  console.log('✓ Fixed Anker PowerCore image (unique charger)')

  // Fix Lontor surge protector — currently same lock image as others, make it distinct
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'PWR-LON-SURGE6'))
  console.log('✓ Fixed Lontor Surge Protector image')

  // Fix Qasa Solar Fan — currently same lock image, make it distinct  
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'HOM-QAS-SOLARFAN'))
  console.log('✓ Qasa Solar Fan image kept (fan image)')

  // Fix Yale Smart Lock — currently same surge protector image, make it distinct
  await db.update(products).set({
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],
    updatedAt: new Date(),
  }).where(eq(products.sku, 'SEC-YAL-SMARTLOCK'))
  console.log('✓ Yale Smart Lock image kept')

  console.log('\nAll final fixes applied!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
