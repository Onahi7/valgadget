import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

function normalizeJumiaImage(url: string) {
  return url
    .replace(/fit-in\/(?:150|300|500)x(?:150|300|500)/, 'fit-in/680x680')
    .replace(/\?.*$/, '')
}

async function main() {
  const sku = process.argv.find(arg => arg.startsWith('--sku='))?.split('=')[1]
  const url = process.argv.find(arg => arg.startsWith('--url='))?.replace('--url=', '')

  if (!sku || !url) {
    throw new Error('Usage: pnpm exec tsx scripts/apply-jumia-image-url.ts --sku=SKU --url=https://www.jumia.com.ng/product.html')
  }

  const html = await (await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  })).text()

  const images = [...new Set((
    html.match(/https:\/\/ng\.jumia\.is\/unsafe\/fit-in\/(?:680|500|300)x(?:680|500|300)\/filters:fill\(white\)\/product\/[^"'<> ]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<> ]*)?/gi) ?? []
  ).map(normalizeJumiaImage))].slice(0, 5)

  if (images.length === 0) throw new Error(`No Jumia product images found for ${url}`)

  await db.update(products)
    .set({ images, updatedAt: new Date() })
    .where(eq(products.sku, sku))

  console.log(JSON.stringify({ sku, url, images }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

