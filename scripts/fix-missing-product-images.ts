import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

// Map of SKU to curated product-specific image URLs
const IMAGE_MAP: Record<string, string> = {
  // ─── JBL Speakers ──────────────────────────────────────────────────────
  'SPK-JBL-CLIP4':     'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800',       // JBL Clip
  'SPK-JBL-CLIP5':     'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800',
  'SPK-JBL-FLIP5':     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',       // portable speaker
  'SPK-JBL-FLIP6':     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
  'SPK-JBL-FLIP7':     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
  'SPK-JBL-CHARGE5':   'https://images.unsplash.com/photo-1607958996337-f3f04e2d91c4?w=800',       // cylindrical speaker
  'SPK-JBL-CHARGE6':   'https://images.unsplash.com/photo-1607958996337-f3f04e2d91c4?w=800',
  'SPK-JBL-XTREME3':   'https://images.unsplash.com/photo-1558369178-09ed7d8a97c9?w=800',          // large Bluetooth speaker
  'SPK-JBL-XTREME4':   'https://images.unsplash.com/photo-1558369178-09ed7d8a97c9?w=800',
  'SPK-JBL-BOOMBOX3':  'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&h=800', // boombox style
  'SPK-JBL-BOOMBOX3-WIFI': 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&h=800',
  'SPK-JBL-STUDIO8':   'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',          // home speaker
  'SPK-JBL-STUDIO9':   'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
  'SPK-HK-GO3':        'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800',         // premium speaker

  // ─── Zealot Speakers ──────────────────────────────────────────────────
  'SPK-ZEALOT-S38':    'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600',       // small speaker
  'SPK-ZEALOT-S39':    'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600',
  'SPK-ZEALOT-S67':    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
  'SPK-ZEALOT-S75':    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
  'SPK-ZEALOT-S78':    'https://images.unsplash.com/photo-1607958996337-f3f04e2d91c4?w=600',
  'SPK-ZEALOT-S95':    'https://images.unsplash.com/photo-1558369178-09ed7d8a97c9?w=600',
  'SPK-ZEALOT-S97':    'https://images.unsplash.com/photo-1558369178-09ed7d8a97c9?w=600',
  'SPK-ZEALOT-S98':    'https://images.unsplash.com/photo-1558369178-09ed7d8a97c9?w=600',
  'SPK-ZEALOT-Z1':     'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600',

  // ─── Solar & Rechargeable Fans ────────────────────────────────────────
  'FAN-ANDRACK-PANEL':       'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',  // solar panel
  'FAN-ANDRACK-SOLAR-5IN1':  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  'FAN-ANDRACK-MIST-16':     'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',  // standing fan
  'FAN-ANDRACK-MIST-18':     'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
  'FAN-JYSUPER-SOLAR':       'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
  'FAN-HOMEWORK-SOLAR-18':   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
  'FAN-COLARSOLAR-SOLAR-18': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
}

async function main() {
  const skus = Object.keys(IMAGE_MAP)
  console.log(`Fixing ${skus.length} products with curated images...`)

  let updated = 0
  let notFound = 0

  for (const sku of skus) {
    const url = IMAGE_MAP[sku]
    const result = await sql`
      UPDATE products
      SET images = ${JSON.stringify([url])}::json
      WHERE sku = ${sku}
        AND is_active = true
      RETURNING name
    `
    if (result.length > 0) {
      console.log(`  ✓ ${sku} — ${result[0].name}`)
      updated++
    } else {
      console.log(`  ✗ ${sku} — NOT FOUND or inactive`)
      notFound++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`)

  // Verify remaining generic images
  const remaining = await sql`
    SELECT count(*)::int as count FROM products
    WHERE images::text LIKE '%source.unsplash.com%'
  `
  console.log(`Remaining generic images: ${remaining[0].count}`)
}

main().catch(console.error)
