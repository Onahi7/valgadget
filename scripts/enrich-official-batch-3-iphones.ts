import dotenv from 'dotenv'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

dotenv.config({ path: '.env.local' })
dotenv.config()

neonConfig.webSocketConstructor = ws

type Spec = { label: string; value: string }

type Enrichment = {
  sku: string
  officialUrl: string
  shortDescription: string
  description: string
  specs: Spec[]
  tags?: string[]
}

const batch: Enrichment[] = [
  {
    sku: 'IPH11',
    officialUrl: 'https://www.apple.com/si/iphone-11/specs/',
    shortDescription: 'UK Used iPhone 11 with 6.1-inch Liquid Retina display, Face ID, and dual 12MP cameras.',
    description:
      'iPhone 11 is a UK used Apple smartphone built for everyday calls, social media, photos, and video. It combines a 6.1-inch Liquid Retina HD display, A13 Bionic chip, dual 12MP rear cameras, Face ID, and strong battery performance in a practical daily-use device.',
    specs: [
      { label: 'Display', value: '6.1-inch Liquid Retina HD display' },
      { label: 'Chip', value: 'A13 Bionic chip' },
      { label: 'Rear Camera', value: 'Dual 12MP camera system' },
      { label: 'Front Camera', value: '12MP TrueDepth camera' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-11', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH11PRO',
    officialUrl: 'https://support.apple.com/en-gb/111879',
    shortDescription: 'UK Used iPhone 11 Pro with 5.8-inch Super Retina XDR display and triple 12MP cameras.',
    description:
      'iPhone 11 Pro is a UK used premium Apple smartphone designed for users who want a compact flagship iPhone with stronger camera performance. It offers a 5.8-inch Super Retina XDR OLED display, A13 Bionic chip, triple 12MP rear cameras, and Face ID for daily use and content capture.',
    specs: [
      { label: 'Display', value: '5.8-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A13 Bionic chip' },
      { label: 'Rear Camera', value: 'Triple 12MP Pro camera system' },
      { label: 'Front Camera', value: '12MP TrueDepth camera' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-11-pro', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH11PM',
    officialUrl: 'https://support.apple.com/en-gb/111879',
    shortDescription: 'UK Used iPhone 11 Pro Max with 6.5-inch Super Retina XDR display and triple 12MP cameras.',
    description:
      'iPhone 11 Pro Max is a UK used Apple smartphone for buyers who prefer a larger screen and longer battery life in the 11 series. It comes with a 6.5-inch Super Retina XDR OLED display, A13 Bionic chip, triple 12MP rear cameras, and Face ID for work, media, and photography.',
    specs: [
      { label: 'Display', value: '6.5-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A13 Bionic chip' },
      { label: 'Rear Camera', value: 'Triple 12MP Pro camera system' },
      { label: 'Front Camera', value: '12MP TrueDepth camera' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-11-pro-max', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH12',
    officialUrl: 'https://support.apple.com/en-gb/111876',
    shortDescription: 'UK Used iPhone 12 with 6.1-inch Super Retina XDR display, 5G, and dual 12MP cameras.',
    description:
      'iPhone 12 is a UK used Apple smartphone built for users who want OLED display quality, 5G support, and dependable day-to-day performance. It features a 6.1-inch Super Retina XDR display, A14 Bionic chip, dual 12MP rear cameras, and Face ID in a slim aluminium design.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A14 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Dual 12MP camera system' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-12', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH12PRO',
    officialUrl: 'https://support.apple.com/en-gb/111875',
    shortDescription: 'UK Used iPhone 12 Pro with 6.1-inch Super Retina XDR display and triple 12MP cameras.',
    description:
      'iPhone 12 Pro is a UK used Apple smartphone suited for users who want a more premium build and advanced camera setup than the regular iPhone 12. It includes a 6.1-inch Super Retina XDR display, A14 Bionic chip, 5G support, triple 12MP rear cameras, and LiDAR Scanner.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A14 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Triple 12MP Pro camera system' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-12-pro', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH12PM',
    officialUrl: 'https://support.apple.com/en-gb/111875',
    shortDescription: 'UK Used iPhone 12 Pro Max with 6.7-inch Super Retina XDR display and triple 12MP cameras.',
    description:
      'iPhone 12 Pro Max is a UK used Apple smartphone built for users who want a larger screen and stronger camera hardware in the 12 series. It offers a 6.7-inch Super Retina XDR display, A14 Bionic chip, 5G support, triple 12MP rear cameras, and LiDAR Scanner.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A14 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Triple 12MP Pro camera system' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-12-pro-max', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH13',
    officialUrl: 'https://support.apple.com/en-gb/111872',
    shortDescription: 'UK Used iPhone 13 with 6.1-inch Super Retina XDR display and advanced dual cameras.',
    description:
      'iPhone 13 is a UK used Apple smartphone made for buyers who want a newer camera system and solid all-round daily performance. It comes with a 6.1-inch Super Retina XDR display, A15 Bionic chip, dual 12MP rear cameras, Face ID, and 5G support.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A15 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Dual 12MP camera system' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-13', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH13PRO',
    officialUrl: 'https://support.apple.com/en-gb/111871',
    shortDescription: 'UK Used iPhone 13 Pro with ProMotion display and triple 12MP Pro cameras.',
    description:
      'iPhone 13 Pro is a UK used Apple smartphone for users who want smoother display performance and stronger camera flexibility. It combines a 6.1-inch Super Retina XDR display with ProMotion, A15 Bionic chip, triple 12MP rear cameras, LiDAR Scanner, and 5G support.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display with ProMotion' },
      { label: 'Chip', value: 'A15 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Triple 12MP Pro camera system' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-13-pro', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH14',
    officialUrl: 'https://support.apple.com/en-gb/111850',
    shortDescription: 'UK Used iPhone 14 with 6.1-inch Super Retina XDR display and improved main camera.',
    description:
      'iPhone 14 is a UK used Apple smartphone for buyers who want strong battery life, OLED screen quality, and a capable camera system. It features a 6.1-inch Super Retina XDR display, A15 Bionic chip, dual 12MP rear cameras, and 5G support for everyday use.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A15 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Dual 12MP camera system' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-14', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH14PLUS',
    officialUrl: 'https://support.apple.com/en-gb/111850',
    shortDescription: 'UK Used iPhone 14 Plus with 6.7-inch Super Retina XDR display and dual 12MP cameras.',
    description:
      'iPhone 14 Plus is a UK used Apple smartphone for users who prefer a larger display and bigger battery in a non-Pro iPhone. It offers a 6.7-inch Super Retina XDR display, A15 Bionic chip, dual 12MP rear cameras, and 5G support.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A15 Bionic chip' },
      { label: 'Connectivity', value: '5G' },
      { label: 'Rear Camera', value: 'Dual 12MP camera system' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-14-plus', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH14PRO',
    officialUrl: 'https://support.apple.com/en-gb/111849',
    shortDescription: 'UK Used iPhone 14 Pro with Dynamic Island, Always-On display, and 48MP main camera.',
    description:
      'iPhone 14 Pro is a UK used Apple smartphone built for buyers who want flagship display and camera features. It combines a 6.1-inch Super Retina XDR display with ProMotion and Always-On, A16 Bionic chip, a 48MP main camera, LiDAR Scanner, and 5G support.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display with ProMotion' },
      { label: 'Chip', value: 'A16 Bionic chip' },
      { label: 'Rear Camera', value: '48MP main camera with Pro camera system' },
      { label: 'Feature', value: 'Dynamic Island and Always-On display' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-14-pro', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH14PM',
    officialUrl: 'https://support.apple.com/en-gb/111849',
    shortDescription: 'UK Used iPhone 14 Pro Max with 6.7-inch ProMotion display and 48MP main camera.',
    description:
      'iPhone 14 Pro Max is a UK used Apple smartphone for users who want a larger flagship iPhone with stronger media and camera experience. It features a 6.7-inch Super Retina XDR display with ProMotion and Always-On, A16 Bionic chip, 48MP main camera, LiDAR Scanner, and 5G support.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display with ProMotion' },
      { label: 'Chip', value: 'A16 Bionic chip' },
      { label: 'Rear Camera', value: '48MP main camera with Pro camera system' },
      { label: 'Feature', value: 'Dynamic Island and Always-On display' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-14-pro-max', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH15',
    officialUrl: 'https://support.apple.com/en-gb/111831',
    shortDescription: 'UK Used iPhone 15 with Dynamic Island, USB-C, and 48MP main camera.',
    description:
      'iPhone 15 is a UK used Apple smartphone designed for users who want a modern iPhone with USB-C and improved camera quality. It includes a 6.1-inch Super Retina XDR display, A16 Bionic chip, 48MP main camera, Dynamic Island, and 5G support.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A16 Bionic chip' },
      { label: 'Rear Camera', value: '48MP main camera with advanced dual-camera system' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Dynamic Island' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-15', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH15PLUS',
    officialUrl: 'https://support.apple.com/en-gb/111831',
    shortDescription: 'UK Used iPhone 15 Plus with 6.7-inch display, USB-C, and 48MP main camera.',
    description:
      'iPhone 15 Plus is a UK used Apple smartphone for users who want a bigger non-Pro iPhone with updated hardware. It combines a 6.7-inch Super Retina XDR display, A16 Bionic chip, 48MP main camera, Dynamic Island, USB-C, and 5G support.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A16 Bionic chip' },
      { label: 'Rear Camera', value: '48MP main camera with advanced dual-camera system' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Dynamic Island' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-15-plus', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH15PRO',
    officialUrl: 'https://support.apple.com/en-gb/111829',
    shortDescription: 'UK Used iPhone 15 Pro with titanium design, Action button, and Pro camera system.',
    description:
      'iPhone 15 Pro is a UK used Apple smartphone for users who want a compact flagship iPhone with stronger pro-level features. It offers a 6.1-inch Super Retina XDR display with ProMotion, A17 Pro chip, 48MP main camera, Action button, USB-C, and LiDAR Scanner.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display with ProMotion' },
      { label: 'Chip', value: 'A17 Pro chip' },
      { label: 'Rear Camera', value: '48MP main camera with Pro camera system' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Action button and titanium design' },
      { label: 'Sensor', value: 'LiDAR Scanner' },
    ],
    tags: ['apple', 'iphone', 'iphone-15-pro', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH15PM',
    officialUrl: 'https://support.apple.com/en-gb/111829',
    shortDescription: 'UK Used iPhone 15 Pro Max with 5x telephoto zoom, titanium design, and USB-C.',
    description:
      'iPhone 15 Pro Max is a UK used Apple smartphone for buyers who want the largest Pro iPhone with stronger zoom capability. It features a 6.7-inch Super Retina XDR display with ProMotion, A17 Pro chip, 48MP main camera, 5x telephoto zoom, Action button, and USB-C.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display with ProMotion' },
      { label: 'Chip', value: 'A17 Pro chip' },
      { label: 'Rear Camera', value: '48MP main camera with Pro camera system' },
      { label: 'Zoom', value: '5x optical telephoto zoom' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Action button and titanium design' },
    ],
    tags: ['apple', 'iphone', 'iphone-15-pro-max', 'uk-used', 'official', 'apple-official'],
  },
  {
    sku: 'IPH16',
    officialUrl: 'https://support.apple.com/en-gb/121029',
    shortDescription: 'New iPhone 16 with Dynamic Island, A18 chip, and 48MP Fusion camera.',
    description:
      'iPhone 16 is a brand new Apple smartphone for users who want current-generation performance and camera upgrades. It includes a 6.1-inch Super Retina XDR display, A18 chip, 48MP Fusion camera, Dynamic Island, USB-C, and 5G support.',
    specs: [
      { label: 'Display', value: '6.1-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A18 chip' },
      { label: 'Rear Camera', value: '48MP Fusion camera system' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Dynamic Island' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-16', 'new', 'official', 'apple-official'],
  },
  {
    sku: 'IPH16PLUS',
    officialUrl: 'https://support.apple.com/en-gb/121029',
    shortDescription: 'New iPhone 16 Plus with 6.7-inch display, A18 chip, and 48MP Fusion camera.',
    description:
      'iPhone 16 Plus is a brand new Apple smartphone for users who want a larger screen in the current iPhone 16 line. It offers a 6.7-inch Super Retina XDR display, A18 chip, 48MP Fusion camera, Dynamic Island, USB-C, and 5G support.',
    specs: [
      { label: 'Display', value: '6.7-inch Super Retina XDR OLED display' },
      { label: 'Chip', value: 'A18 chip' },
      { label: 'Rear Camera', value: '48MP Fusion camera system' },
      { label: 'Charging Port', value: 'USB-C' },
      { label: 'Feature', value: 'Dynamic Island' },
      { label: 'Water Resistance', value: 'IP68' },
    ],
    tags: ['apple', 'iphone', 'iphone-16-plus', 'new', 'official', 'apple-official'],
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
        const mergedSpecs = mergeSpecs(item.specs, row.specs ?? [])
        const mergedTags = Array.from(new Set([...(row.tags ?? []), ...(item.tags ?? [])]))
        const nextImages = localImage ? [localImage] : row.images ?? []

        await pool.query(
          `
            update products
            set short_description = $1,
                description = $2,
                specs = $3::json,
                images = $4::json,
                tags = $5::json,
                updated_at = now()
            where id = $6
          `,
          [
            item.shortDescription,
            item.description,
            JSON.stringify(mergedSpecs),
            JSON.stringify(nextImages),
            JSON.stringify(mergedTags),
            row.id,
          ]
        )

        updated += 1
        console.log(`Updated official iPhone data for ${item.sku} -> ${row.name}`)
      } catch (error) {
        failed += 1
        console.error(`Failed ${item.sku}:`, error)
      }
    }
  } finally {
    await pool.end()
  }

  console.log(`Official iPhone batch complete: ${updated} updated, ${failed} failed.`)
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
