/**
 * Apply Tech Direct-style full-bleed cover images to top-level categories.
 *
 * Run with: pnpm tsx scripts/apply-cover-images.ts
 *
 * Each cover image is a wide, photographic banner that appears as a "chapter
 * header" on the homepage above the category's product grid.
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { categories } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

const COVER_IMAGES: Record<string, string> = {
  // Audio
  'audio-entertainment':
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80',
  'earbuds':
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1600&q=80',
  'speakers-soundbars':
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1600&q=80',
  'headphones':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',

  // Computing
  'computing-accessories':
    'https://images.unsplash.com/photo-1593640408182-31c228b4f3d3?auto=format&fit=crop&w=1600&q=80',
  'smartphones-tablets':
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
  'laptops-monitors':
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80',

  // Home & kitchen
  'home-appliances-comfort':
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80',
  'cooling-air-care':
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1600&q=80',
  'kitchen-refrigeration':
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1600&q=80',

  // Power
  'power-charging':
    'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=1600&q=80',
  'powerbanks':
    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1600&q=80',

  // Networking
  'networking-connectivity':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',

  // Wearables
  'wearables-smart-devices':
    'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1600&q=80',
  'smartwatches':
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',

  // Security
  'security-surveillance':
    'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=1600&q=80',

  // Drones
  'drones-accessories':
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1600&q=80',

  // Content creation
  'content-creation-kits':
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1600&q=80',
  'camera-recording-gear':
    'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=1600&q=80',

  // Sport
  'sport-equipment':
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
}

async function run() {
  let updated = 0
  let missing = 0
  for (const [slug, image] of Object.entries(COVER_IMAGES)) {
    const result = await db
      .update(categories)
      .set({ coverImage: image, updatedAt: new Date() })
      .where(eq(categories.slug, slug))
    updated++
  }

  // Report which categories don't have a cover image yet
  const all = await db
    .select({ slug: categories.slug, name: categories.name, coverImage: categories.coverImage })
    .from(categories)
  const withoutCover = all.filter(c => !c.coverImage)
  missing = withoutCover.length

  console.log(`Updated ${updated} cover images`)
  if (missing > 0) {
    console.log(`\nCategories still without a cover image (${missing}):`)
    for (const c of withoutCover) {
      console.log(`  - ${c.name} (${c.slug})`)
    }
  }
  process.exit(0)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
