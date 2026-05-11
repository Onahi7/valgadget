import dotenv from 'dotenv'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

dotenv.config({ path: '.env.local' })
dotenv.config()

neonConfig.webSocketConstructor = ws

type Spec = { label: string; value: string }

type BatchItem = {
  sku: string
  officialUrl: string
  extraSpecs: Spec[]
}

const batch: BatchItem[] = [
  {
    sku: 'RDM-A3X',
    officialUrl: 'https://www.mi.com/global/product/redmi-a3x/',
    extraSpecs: [
      { label: 'Display', value: '6.71-inch Dot Drop display, up to 90Hz' },
      { label: 'Processor', value: 'Unisoc T603' },
      { label: 'Rear Camera', value: '8MP main camera' },
      { label: 'Battery', value: '5000mAh, 10W charging' },
    ],
  },
  {
    sku: 'RDM-A5',
    officialUrl: 'https://www.mi.com/global/product/redmi-a5/',
    extraSpecs: [
      { label: 'Display', value: '6.88-inch display' },
      { label: 'Rear Camera', value: '32MP AI dual camera' },
      { label: 'Battery', value: '5200mAh, 15W fast charging' },
    ],
  },
  {
    sku: 'RDM-15',
    officialUrl: 'https://www.mi.com/global/product/redmi-15/',
    extraSpecs: [
      { label: 'Display', value: '6.9-inch FHD+ display, up to 144Hz' },
      { label: 'Processor', value: 'Snapdragon 685' },
      { label: 'Rear Camera', value: '50MP AI dual camera' },
      { label: 'Battery', value: '7000mAh, 33W fast charging' },
      { label: 'Durability', value: 'IP64 dust and water resistance' },
    ],
  },
  {
    sku: 'RDM-15C',
    officialUrl: 'https://www.mi.com/global/product/redmi-15c/',
    extraSpecs: [
      { label: 'Display', value: '6.9-inch display, up to 120Hz' },
      { label: 'Processor', value: 'MediaTek Helio G81-Ultra' },
      { label: 'Rear Camera', value: '50MP AI dual camera' },
      { label: 'Battery', value: '6000mAh, 33W fast charging' },
      { label: 'Durability', value: 'IP64 dust and water resistance' },
    ],
  },
  {
    sku: 'RDM-15C5G',
    officialUrl: 'https://www.mi.com/global/product/redmi-15c-5g/',
    extraSpecs: [
      { label: 'Connectivity', value: '5G' },
      { label: 'Display', value: '6.9-inch display, up to 120Hz' },
      { label: 'Processor', value: 'MediaTek Dimensity 6300' },
      { label: 'Rear Camera', value: '50MP AI dual camera' },
      { label: 'Battery', value: '6000mAh, 33W fast charging' },
      { label: 'Durability', value: 'IP64 dust and water resistance' },
    ],
  },
  {
    sku: 'RDM-NOTE15',
    officialUrl: 'https://www.mi.com/global/product/redmi-note-15/',
    extraSpecs: [
      { label: 'Battery', value: '6500mAh battery' },
      { label: 'Camera System', value: 'Official Redmi Note 15 series camera platform' },
    ],
  },
  {
    sku: 'RDM-NOTE15PRO',
    officialUrl: 'https://www.mi.com/global/product/redmi-note-15-pro/',
    extraSpecs: [
      { label: 'Display', value: '6.77-inch FHD+ AMOLED display' },
      { label: 'Processor', value: 'MediaTek Helio G200-Ultra' },
      { label: 'Rear Camera', value: '200MP main camera with OIS' },
      { label: 'Battery', value: '6500mAh, 45W turbo charging' },
      { label: 'Durability', value: 'IP65 dust and water resistance' },
    ],
  },
  {
    sku: 'RDM-NOTE15PROPLUS5G',
    officialUrl: 'https://www.mi.com/global/product/redmi-note-15-pro-plus-5g/',
    extraSpecs: [
      { label: 'Connectivity', value: '5G' },
      { label: 'Display', value: '6.83-inch 1.5K CrystalRes AMOLED display' },
      { label: 'Processor', value: 'Snapdragon 7s Gen 4' },
      { label: 'Rear Camera', value: '200MP main camera with OIS' },
      { label: 'Battery', value: '6500mAh, 100W HyperCharge' },
      { label: 'Durability', value: 'IP66 / IP68 / IP69 / IP69K water and dust resistance' },
    ],
  },
  {
    sku: 'RDM-PADSE',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-se/specs/',
    extraSpecs: [
      { label: 'Display', value: '11-inch FHD+ display, up to 90Hz' },
      { label: 'Processor', value: 'Snapdragon 680' },
      { label: 'Battery', value: '8000mAh' },
      { label: 'Audio', value: 'Quad speakers with Dolby Atmos' },
    ],
  },
  {
    sku: 'RDM-PADSE87',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-se-8-7-inch/specs/',
    extraSpecs: [
      { label: 'Display', value: '8.7-inch display, up to 90Hz' },
      { label: 'Processor', value: 'MediaTek Helio G85' },
      { label: 'Battery', value: '6650mAh, 18W fast charging' },
      { label: 'Audio', value: 'Dual speakers with Dolby Atmos' },
    ],
  },
  {
    sku: 'RDM-PADSE874G',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-se-8-7-inch-4g/specs/',
    extraSpecs: [
      { label: 'Connectivity', value: '4G' },
      { label: 'Display', value: '8.7-inch display, up to 90Hz' },
      { label: 'Processor', value: 'MediaTek Helio G85' },
      { label: 'Battery', value: '6650mAh, 18W fast charging' },
      { label: 'Audio', value: 'Dual speakers with Dolby Atmos' },
    ],
  },
  {
    sku: 'RDM-PADPRO',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-pro/',
    extraSpecs: [
      { label: 'Display', value: '12.1-inch 2.5K display, up to 120Hz' },
      { label: 'Processor', value: 'Snapdragon 7s Gen 2' },
      { label: 'Battery', value: '10000mAh, 33W fast charging' },
      { label: 'Audio', value: 'Quad speakers with Dolby Atmos and Dolby Vision support' },
    ],
  },
  {
    sku: 'RDM-PADPRO5G',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-pro-5g/specs/',
    extraSpecs: [
      { label: 'Connectivity', value: '5G' },
      { label: 'Display', value: '12.1-inch 2.5K display, up to 120Hz' },
      { label: 'Battery', value: '10000mAh, 33W fast charging' },
      { label: 'Audio', value: 'Quad speakers with Dolby Atmos' },
    ],
  },
  {
    sku: 'RDM-PAD2',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-2/specs/',
    extraSpecs: [
      { label: 'Display', value: '11-inch 2.5K display, up to 90Hz' },
      { label: 'Processor', value: 'MediaTek Helio G100-Ultra' },
      { label: 'Battery', value: '9000mAh, 18W fast charging' },
    ],
  },
  {
    sku: 'RDM-PAD24G',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-2-9-7-inch-4g/specs/',
    extraSpecs: [
      { label: 'Connectivity', value: '4G' },
      { label: 'Display', value: '9.7-inch 2K display, up to 120Hz' },
    ],
  },
  {
    sku: 'RDM-PAD2PRO',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-2-pro/?skupanel=1',
    extraSpecs: [
      { label: 'Display', value: '12.1-inch 2.5K display' },
      { label: 'Product Line', value: 'Redmi Pad 2 Pro' },
    ],
  },
  {
    sku: 'RDM-PAD2PRO5G',
    officialUrl: 'https://www.mi.com/global/product/redmi-pad-2-pro-5g/specs',
    extraSpecs: [
      { label: 'Connectivity', value: '5G + eSIM' },
      { label: 'Display', value: '12.1-inch 2.5K display, up to 120Hz' },
      { label: 'Processor', value: 'Snapdragon 7s Gen 4' },
      { label: 'Battery', value: '12000mAh, 33W fast charging' },
    ],
  },
  {
    sku: 'XIA-14T',
    officialUrl: 'https://www.mi.com/global/product/xiaomi-14t/specs/',
    extraSpecs: [
      { label: 'Display', value: '2712 x 1220 AMOLED display, up to 144Hz' },
      { label: 'Processor', value: 'MediaTek Dimensity 8300-Ultra' },
      { label: 'Battery', value: '5000mAh, 67W HyperCharge' },
      { label: 'Front Camera', value: '32MP selfie camera' },
    ],
  },
  {
    sku: 'XIA-15T',
    officialUrl: 'https://www.mi.com/global/product/xiaomi-15t/',
    extraSpecs: [
      { label: 'Display', value: '6.83-inch 1.5K display, 120Hz' },
      { label: 'Connectivity', value: 'Enhanced Wi-Fi, Bluetooth, GPS, and cellular tuning' },
    ],
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
          specs: Spec[] | null
          tags: string[] | null
          images: string[] | null
        }>(
          `select id, name, specs, tags, images from products where sku = $1 limit 1`,
          [item.sku]
        )

        if (!product.rows[0]) {
          console.warn(`Missing product for SKU ${item.sku}`)
          failed += 1
          continue
        }

        const row = product.rows[0]
        const meta = await fetchMeta(item.officialUrl)
        const localImage = meta.image ? await downloadImage(meta.image, slugify(item.sku), imageDir) : null
        const mergedSpecs = mergeSpecs(item.extraSpecs, row.specs ?? [])
        const mergedTags = Array.from(new Set([...(row.tags ?? []), 'official', 'xiaomi-official']))
        const nextImages = localImage ? [localImage] : row.images ?? []

        await pool.query(
          `
            update products
            set specs = $1::json,
                images = $2::json,
                tags = $3::json,
                updated_at = now()
            where id = $4
          `,
          [JSON.stringify(mergedSpecs), JSON.stringify(nextImages), JSON.stringify(mergedTags), row.id]
        )

        updated += 1
        console.log(`Updated official Xiaomi data for ${item.sku} -> ${row.name}`)
      } catch (error) {
        failed += 1
        console.error(`Failed ${item.sku}:`, error)
      }
    }
  } finally {
    await pool.end()
  }

  console.log(`Official Xiaomi batch complete: ${updated} updated, ${failed} failed.`)
}

async function fetchMeta(url: string): Promise<{ image: string | null }> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  const direct = pickMeta(html, ['og:image', 'twitter:image']) ?? extractImage(html)
  return { image: direct ? normalizeUrl(url, direct) : null }
}

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const regexes = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapeRegExp(name)}["']`, 'i'),
    ]
    for (const regex of regexes) {
      const match = html.match(regex)
      if (match?.[1]) return decodeHtml(match[1])
    }
  }
  return null
}

function extractImage(html: string): string | null {
  const match = html.match(/https?:\/\/[^"' ]+\.(?:png|jpg|jpeg|webp)/i)
  return match?.[0] ?? null
}

function normalizeUrl(baseUrl: string, imageUrl: string): string {
  return new URL(imageUrl, baseUrl).toString()
}

function decodeHtml(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
}

async function downloadImage(url: string, fileStem: string, imageDir: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
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

function mergeSpecs(primary: Spec[], existing: Spec[]): Spec[] {
  const map = new Map<string, string>()
  for (const item of primary) map.set(item.label, item.value)
  for (const item of existing) {
    if (!map.has(item.label) && item.value?.trim()) map.set(item.label, item.value.trim())
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
