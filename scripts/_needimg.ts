import dotenv from 'dotenv'; dotenv.config({ path: '.env.local' }); dotenv.config()
import { Pool, neonConfig } from '@neondatabase/serverless'; import ws from 'ws'; neonConfig.webSocketConstructor = ws
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const { rows } = await pool.query(`select sku, name, images from products where is_active = true`)
    const needsImages: {sku:string; name:string; images:string[]}[] = []
    for (const r of rows) {
      const imgs: string[] = r.images ?? []
      const local = imgs.filter(i => i.startsWith('/'))
      if (local.length === 0) needsImages.push({ sku: r.sku, name: r.name, images: imgs })
    }
    console.log(`Products needing images: ${needsImages.length}\n`)
    for (const p of needsImages) {
      console.log(`SKU: ${p.sku}`)
      console.log(`Name: ${p.name}`)
      console.log(`Current URLs: ${p.images.slice(0,2).join(' | ')}`)
      console.log()
    }
  } finally { await pool.end() }
}
main().catch(e => { console.error(e); process.exit(1) })
