import dotenv from 'dotenv'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

dotenv.config({ path: '.env.local' })
dotenv.config()

neonConfig.webSocketConstructor = ws

type BatchItem = {
  sku: string
  officialUrl: string
  imageUrl: string
  tags?: string[]
}

const batch: BatchItem[] = [
  {
    sku: 'RDM-A3PRO',
    officialUrl: 'https://www.mi.com/africa-en/product/redmi-a3-pro/',
    imageUrl: 'https://i02.appmifile.com/mi-com-product/fly-birds/redmi-a3-pro/pc/8d01f9f8d23cd8447553921ebdba54a1.jpg',
    tags: ['official', 'xiaomi-official'],
  },
  {
    sku: 'SPK-SC-BOOM2-PLUS',
    officialUrl: 'https://www.soundcore.com/boom2-plus-outdoor-bass-speaker',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0516/3761/6830/files/A3134011-Boom_2_plus-2000x2000-01.png',
    tags: ['official', 'soundcore-official'],
  },
  {
    sku: 'WAT-APL-S11-42-GPS-UK',
    officialUrl: 'https://www.apple.com/apple-watch-series-11/',
    imageUrl: 'https://www.apple.com/v/apple-watch-series-11/c/images/meta/apple-watch-series-11__cim89z1i9spe_og.png?202605080833',
    tags: ['official', 'apple-official'],
  },
  {
    sku: 'WAT-APL-ULTRA-49-UK',
    officialUrl: 'https://www.apple.com/apple-watch-ultra-2/',
    imageUrl: 'https://www.apple.com/assets-www/en_WW/watch/og/watch_og_1ff2ee953.png',
    tags: ['official', 'apple-official'],
  },
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing. Add it to .env.local before running this script.')

  const pool = new Pool({ connectionString: databaseUrl })
  const imageDir = path.join(process.cwd(), 'public', 'catalog', 'official')
  await fs.mkdir(imageDir, { recursive: true })

  let updated = 0
  let failed = 0

  try {
    for (const item of batch) {
      try {
        const product = await pool.query<{
          id: string
          name: string
          tags: string[] | null
        }>(
          `select id, name, tags from products where sku = $1 limit 1`,
          [item.sku]
        )

        if (!product.rows[0]) {
          console.warn(`Missing product for SKU ${item.sku}`)
          failed += 1
          continue
        }

        const row = product.rows[0]
        const localImage = await downloadImage(item.imageUrl, slugify(item.sku), imageDir)
        const mergedTags = Array.from(new Set([...(row.tags ?? []), ...(item.tags ?? [])]))

        await pool.query(
          `
            update products
            set images = $1::json,
                tags = $2::json,
                updated_at = now()
            where id = $3
          `,
          [JSON.stringify([localImage]), JSON.stringify(mergedTags), row.id]
        )

        updated += 1
        console.log(`Updated official image for ${item.sku} -> ${row.name}`)
      } catch (error) {
        failed += 1
        console.error(`Failed ${item.sku}:`, error)
      }
    }
  } finally {
    await pool.end()
  }

  console.log(`Official image catch-up complete: ${updated} updated, ${failed} failed.`)
}

async function downloadImage(url: string, fileStem: string, imageDir: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      referer: 'https://www.apple.com/',
    },
  })
  if (!res.ok) throw new Error(`Failed to download image ${url}: ${res.status}`)
  const contentType = res.headers.get('content-type') ?? ''
  const ext = extensionFrom(contentType, url)
  const absolutePath = path.join(imageDir, `${fileStem}.${ext}`)
  const bytes = await res.arrayBuffer()
  await fs.writeFile(absolutePath, Buffer.from(bytes))
  return `/catalog/official/${fileStem}.${ext}`
}

function extensionFrom(contentType: string, url: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('avif')) return 'avif'
  if (contentType.includes('svg')) return 'svg'
  const pathname = new URL(url).pathname.toLowerCase()
  const match = pathname.match(/\.([a-z0-9]+)$/)
  return match?.[1] ?? 'jpg'
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
