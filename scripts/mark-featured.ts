import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq, inArray } from 'drizzle-orm'

const FEATURED_SKUS = [
  'COM-APL-IP15PM-256',
  'AUD-PS5-SLIM',
  'DRN-DJI-MINI4PRO',
  'WEA-APL-WSE2',
  'AUD-JBL-FLIP6',
  'AUD-LG-55-4K',
  'CCK-CAN-M50II',
  'NET-STR-STD-KIT',
]

const NEW_SKUS = [
  'COM-APL-IP15-128',
  'COM-SAM-A55-5G',
  'AUD-AMZ-FIRE4K',
  'WEA-RBM-META',
  'DRN-DJI-MIC2',
  'COM-RDM-N13PRO',
  'AUD-XGI-MOGO2',
  'SEC-YAL-SMARTLOCK',
]

async function run() {
  await db.update(products).set({ featured: true, updatedAt: new Date() }).where(inArray(products.sku, FEATURED_SKUS))
  console.log(`Marked ${FEATURED_SKUS.length} products as featured`)

  await db.update(products).set({ isNew: true, updatedAt: new Date() }).where(inArray(products.sku, NEW_SKUS))
  console.log(`Marked ${NEW_SKUS.length} products as new`)

  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
