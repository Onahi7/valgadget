import dotenv from 'dotenv'
import { promises as fs } from 'node:fs'
import path from 'node:path'

dotenv.config({ path: '.env.local' })
dotenv.config()

import { eq, sql } from 'drizzle-orm'
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'

type Spec = { label: string; value: string }

type Enrichment = {
  sku: string
  officialUrl: string
  imageUrl?: string
  shortDescription: string
  description: string
  specs: Spec[]
  tags?: string[]
}

const batch: Enrichment[] = [
  {
    sku: 'MON-HP-527SF-27',
    officialUrl: 'https://www.hp.com/us-en/shop/pdp/hp-series-5-27-inch-fhd-monitor-527sf',
    shortDescription: '27-inch Full HD IPS monitor with a slim-bezel design for work and home setups.',
    description:
      'The HP Series 5 27-inch FHD Monitor 527sf is designed for everyday work, browsing, and entertainment. It features a 27-inch IPS display, Full HD 1920 x 1080 resolution, wide viewing angles, and a slim-bezel design that fits well in home and office setups.',
    specs: [
      { label: 'Display Size', value: '27-inch' },
      { label: 'Panel Type', value: 'IPS LCD' },
      { label: 'Resolution', value: '1920 x 1080 (Full HD)' },
      { label: 'Aspect Ratio', value: '16:9' },
      { label: 'Warranty', value: '1-year HP limited warranty' },
      { label: 'In the Box', value: 'Monitor, HDMI cable, power adapter, AC power cord, document kit' },
    ],
    tags: ['hp', 'monitor', 'fhd', 'ips', 'official'],
  },
  {
    sku: 'WAT-APL-S11-46-CELL',
    officialUrl: 'https://www.apple.com/apple-watch-series-11/',
    shortDescription: '46mm Apple Watch Series 11 with GPS + Cellular, fast charging, and all-day battery life.',
    description:
      'Apple Watch Series 11 46mm GPS + Cellular gives you calls, messages, fitness tracking, and health features in one device. It supports cellular connectivity, fast charging, water resistance, and up to 24 hours of normal use, making it suitable for daily wear, workouts, and travel.',
    specs: [
      { label: 'Case Size', value: '46mm' },
      { label: 'Connectivity', value: 'GPS + Cellular' },
      { label: 'Battery Life', value: 'Up to 24 hours normal use' },
      { label: 'Low Power Mode', value: 'Up to 38 hours' },
      { label: 'Water Resistance', value: '50 meters' },
      { label: 'Dust Resistance', value: 'IP6X' },
      { label: 'Charging', value: 'Fast-charge capable, up to 80% in about 30 minutes' },
    ],
    tags: ['apple', 'apple-watch', 'series-11', 'cellular', 'official'],
  },
  {
    sku: 'WAT-APL-S11-46-GPS',
    officialUrl: 'https://www.apple.com/apple-watch-series-11/',
    shortDescription: '46mm Apple Watch Series 11 with GPS, fast charging, and advanced health features.',
    description:
      'Apple Watch Series 11 46mm GPS is built for fitness, daily communication, and health tracking. It offers a large display, fast charging, water resistance, and up to 24 hours of battery life, making it a practical smartwatch for work, movement, and everyday notifications.',
    specs: [
      { label: 'Case Size', value: '46mm' },
      { label: 'Connectivity', value: 'GPS' },
      { label: 'Battery Life', value: 'Up to 24 hours normal use' },
      { label: 'Low Power Mode', value: 'Up to 38 hours' },
      { label: 'Water Resistance', value: '50 meters' },
      { label: 'Dust Resistance', value: 'IP6X' },
      { label: 'Charging', value: 'Fast-charge capable, up to 80% in about 30 minutes' },
    ],
    tags: ['apple', 'apple-watch', 'series-11', 'gps', 'official'],
  },
  {
    sku: 'WAT-APL-SE3-44-GPS-UK',
    officialUrl: 'https://www.apple.com/apple-watch-se/',
    shortDescription: '44mm Apple Watch SE 3 with GPS, Always-On display, and fast charging.',
    description:
      'Apple Watch SE 3 44mm GPS combines fitness tracking, calls, notifications, and safety features in a simpler Apple Watch option. It comes with an Always-On Retina display, fast charging, Bluetooth 5.3, water resistance, and up to 18 hours of battery life for everyday use.',
    specs: [
      { label: 'Case Size', value: '44mm' },
      { label: 'Connectivity', value: 'GPS' },
      { label: 'Display', value: 'Always-On Retina display with OLED and LTPO' },
      { label: 'Battery Life', value: 'Up to 18 hours normal use' },
      { label: 'Low Power Mode', value: 'Up to 32 hours' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3' },
      { label: 'Charging', value: 'Fast-charge capable, up to 80% in about 45 minutes' },
      { label: 'Water Resistance', value: '50 meters' },
    ],
    tags: ['apple', 'apple-watch', 'se-3', 'gps', 'official'],
  },
  {
    sku: 'WAT-APL-SE3-40-GPS-UK',
    officialUrl: 'https://www.apple.com/apple-watch-se/',
    shortDescription: '40mm Apple Watch SE 3 with GPS, Always-On display, and fast charging.',
    description:
      'Apple Watch SE 3 40mm GPS is a compact smartwatch for calls, fitness, daily activity, and basic health features. It includes an Always-On Retina display, fast charging, Bluetooth 5.3, water resistance, and up to 18 hours of normal battery life.',
    specs: [
      { label: 'Case Size', value: '40mm' },
      { label: 'Connectivity', value: 'GPS' },
      { label: 'Display', value: 'Always-On Retina display with OLED and LTPO' },
      { label: 'Battery Life', value: 'Up to 18 hours normal use' },
      { label: 'Low Power Mode', value: 'Up to 32 hours' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3' },
      { label: 'Charging', value: 'Fast-charge capable, up to 80% in about 45 minutes' },
      { label: 'Water Resistance', value: '50 meters' },
    ],
    tags: ['apple', 'apple-watch', 'se-3', 'gps', 'official'],
  },
  {
    sku: 'SPK-JBL-CLIP4',
    officialUrl: 'https://www.jbl.com/CLIP%2B4-.html?dwvar_CLIP+4-_color=Grey-AM-Current',
    shortDescription: 'Ultra-portable JBL speaker with integrated carabiner and IP67 protection.',
    description:
      'JBL Clip 4 is a compact portable Bluetooth speaker built for travel, outdoor use, and personal listening. It comes with an integrated carabiner, IP67 waterproof and dustproof protection, wireless Bluetooth streaming, and up to 10 hours of battery life.',
    specs: [
      { label: 'Bluetooth Version', value: '5.1' },
      { label: 'Battery Life', value: 'Up to 10 hours' },
      { label: 'Charging Time', value: '3 hours' },
      { label: 'Water and Dust Resistance', value: 'IP67' },
      { label: 'Wireless Streaming', value: 'Yes' },
    ],
    tags: ['jbl', 'speaker', 'clip-4', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-CLIP5',
    officialUrl: 'https://www.jbl.com/CLIP-5.html?dwvar_CLIP-5_color=White-AM-Current&locale=en_US',
    shortDescription: 'Ultra-portable JBL speaker with redesigned carabiner and Auracast support.',
    description:
      'JBL Clip 5 is a portable Bluetooth speaker for daily movement, travel, and outdoor use. It features a redesigned integrated carabiner, IP67 waterproof and dustproof protection, Auracast multi-speaker connection, and up to 12 hours of playtime plus extra battery with Playtime Boost.',
    specs: [
      { label: 'Battery Life', value: 'Up to 12 hours, plus 3 hours with Playtime Boost' },
      { label: 'Water and Dust Resistance', value: 'IP67' },
      { label: 'Wireless Sharing', value: 'Auracast multi-speaker connection' },
      { label: 'Feature', value: 'Redesigned integrated carabiner' },
    ],
    tags: ['jbl', 'speaker', 'clip-5', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-CHARGE5',
    officialUrl: 'https://www.jbl.com/bluetooth-speakers/CHARGE5-.html?dwvar_CHARGE5-_color=Grey-AM-Current&locale=en_US',
    shortDescription: 'Portable JBL speaker with powerbank function and all-day battery life.',
    description:
      'JBL Charge 5 is a portable Bluetooth speaker with strong sound output, long battery life, and a built-in powerbank. It is suitable for home use, outdoor listening, and gatherings, with IP67 protection and a design that balances portability with fuller sound.',
    specs: [
      { label: 'Battery Life', value: 'Up to 20 hours' },
      { label: 'Water and Dust Resistance', value: 'IP67' },
      { label: 'Sound System', value: 'Long excursion driver, separate tweeter, dual bass radiators' },
      { label: 'Powerbank', value: 'Built-in' },
    ],
    tags: ['jbl', 'speaker', 'charge-5', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-CHARGE6',
    officialUrl: 'https://www.jbl.com/CHARGE-6.html?dwvar_CHARGE-6_color=Black-AM-Current&locale=en_US',
    shortDescription: 'Portable JBL speaker with AI Sound Boost, Auracast, and built-in powerbank.',
    description:
      'JBL Charge 6 is a portable Bluetooth speaker designed for louder sound, stronger durability, and longer playtime. It features AI Sound Boost, Auracast multi-speaker connection, waterproof and drop-proof protection, and a built-in powerbank for charging devices while listening.',
    specs: [
      { label: 'Battery Life', value: 'Up to 24 hours, plus 4 hours with Playtime Boost' },
      { label: 'Wireless Sharing', value: 'Auracast multi-speaker connection' },
      { label: 'Sound Processing', value: 'AI Sound Boost' },
      { label: 'Durability', value: 'Waterproof, dustproof, and drop-proof' },
      { label: 'Powerbank', value: 'Built-in' },
    ],
    tags: ['jbl', 'speaker', 'charge-6', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-FLIP6',
    officialUrl: 'https://www.jbl.com/FLIP-6-.html?dwvar_FLIP-6-_color=Teal-AM-Current',
    shortDescription: 'Portable JBL speaker with a 2-way speaker system and waterproof body.',
    description:
      'JBL Flip 6 is a portable Bluetooth speaker built for clear sound, strong bass, and easy movement. It uses a 2-way speaker system with a separate tweeter and dual bass radiators, making it suitable for indoor listening, outings, and everyday entertainment.',
    specs: [
      { label: 'Sound System', value: '2-way system with racetrack-shaped driver, separate tweeter, dual bass radiators' },
      { label: 'Water and Dust Resistance', value: 'IP67' },
      { label: 'Bluetooth', value: 'Portable wireless speaker' },
    ],
    tags: ['jbl', 'speaker', 'flip-6', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-FLIP7',
    officialUrl: 'https://www.jbl.com/FLIP-7.html?dwvar_FLIP-7_color=Funky+Black-AM-Current&locale=en_US',
    shortDescription: 'Portable JBL speaker with Auracast and tougher outdoor-ready protection.',
    description:
      'JBL Flip 7 is a portable speaker for users who want strong wireless sound in a compact body. It supports Auracast multi-speaker connection and comes with waterproof, drop-proof construction, making it suitable for indoor use, travel, and outdoor listening.',
    specs: [
      { label: 'Wireless Sharing', value: 'Auracast multi-speaker connection' },
      { label: 'Durability', value: 'Portable waterproof and drop-proof speaker' },
      { label: 'Sound', value: 'Bold JBL Pro Sound' },
    ],
    tags: ['jbl', 'speaker', 'flip-7', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-XTREME3',
    officialUrl: 'https://www.jbl.com/XTREME-3-.html?dwvar_XTREME-3-_color=Black+Camo-AM-Current&locale=en_US',
    shortDescription: 'High-output JBL portable speaker with built-in powerbank and waterproof design.',
    description:
      'JBL Xtreme 3 is a larger portable Bluetooth speaker with high sound output and a built-in powerbank. It is designed for parties, outdoor use, and users who need stronger bass, wider sound coverage, and a rugged waterproof body.',
    specs: [
      { label: 'Sound', value: 'Massive JBL Original Pro Sound' },
      { label: 'Durability', value: 'Portable waterproof speaker' },
      { label: 'Powerbank', value: 'Built-in' },
    ],
    tags: ['jbl', 'speaker', 'xtreme-3', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-JBL-XTREME4',
    officialUrl: 'https://global.jbl.com/bluetooth-speakers/XTREME-4.html',
    shortDescription: 'Large JBL portable speaker with AI Sound Boost, Auracast, and replaceable battery.',
    description:
      'JBL Xtreme 4 is a high-power portable Bluetooth speaker designed for bigger sound and outdoor use. It features dual woofers, dual tweeters, AI Sound Boost, Auracast support, IP67 protection, and a replaceable battery for longer-term use.',
    specs: [
      { label: 'Sound System', value: 'Two woofers, two tweeters, dual passive radiators' },
      { label: 'Battery Life', value: 'Up to 24 hours, plus 6 hours with Playtime Boost' },
      { label: 'Durability', value: 'IP67 waterproof and dustproof' },
      { label: 'Wireless Sharing', value: 'Auracast multi-speaker connection' },
      { label: 'Battery', value: 'Replaceable battery' },
      { label: 'Powerbank', value: 'Built-in' },
    ],
    tags: ['jbl', 'speaker', 'xtreme-4', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-SC-BOOM2',
    officialUrl: 'https://www.soundcore.com/au/products/boom2-bluetooth-speaker-for-bass',
    shortDescription: 'Outdoor soundcore speaker with 80W max output, BassUp 2.0, and 24-hour playtime.',
    description:
      'soundcore Boom 2 is a portable outdoor Bluetooth speaker with 80W maximum output, 2.1 channel audio, and BassUp 2.0 technology. It offers up to 24 hours of playtime, IPX7 waterproof protection, and a built-in powerbank for extra convenience.',
    specs: [
      { label: 'Output', value: '80W max' },
      { label: 'Audio System', value: '2.1 channel audio' },
      { label: 'Bass Tech', value: 'BassUp 2.0' },
      { label: 'Battery Life', value: 'Up to 24 hours' },
      { label: 'Durability', value: 'IPX7 waterproof and floatable' },
      { label: 'Powerbank', value: 'Built-in' },
    ],
    tags: ['soundcore', 'speaker', 'boom-2', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-SC-BOOM2-PLUS',
    officialUrl: 'https://www.soundcore.com/boom2-plus-outdoor-bass-speaker',
    shortDescription: 'Outdoor soundcore speaker with 140W max output, 2+2 stereo sound, and fast charging.',
    description:
      'soundcore Boom 2 Plus is a high-output Bluetooth speaker for parties, outdoor activities, and bigger spaces. It delivers up to 140W max output, uses a 2+2 stereo setup, supports 30W fast charging, and comes with IPX7 waterproof protection and a built-in powerbank.',
    specs: [
      { label: 'Output', value: '140W max, 100W standard' },
      { label: 'Audio System', value: '2+2 stereo sound' },
      { label: 'Bass Response', value: '40Hz bass' },
      { label: 'Drivers', value: '50W woofer x2, 20W tweeter x2' },
      { label: 'Battery Life', value: 'Up to 20 hours' },
      { label: 'Charging', value: '30W fast charging, full charge in about 3 hours' },
      { label: 'Durability', value: 'IPX7 waterproof and floatable' },
      { label: 'Powerbank', value: 'Built-in 10W power bank' },
    ],
    tags: ['soundcore', 'speaker', 'boom-2-plus', 'bluetooth', 'official'],
  },
  {
    sku: 'SPK-SC-BOOM2-SE',
    officialUrl: 'https://www.soundcore.com/au/products/soundcore-boom-2-se',
    shortDescription: 'Portable soundcore speaker with deep bass, long battery life, and IPX7 protection.',
    description:
      'soundcore Boom 2 SE is a portable Bluetooth speaker designed for casual listening, travel, and outdoor use. It offers deep bass, clear audio, IPX7 waterproof protection, and a compact body that is easy to carry around.',
    specs: [
      { label: 'Sound', value: 'Deep bass and clear audio' },
      { label: 'Durability', value: 'IPX7 waterproof' },
      { label: 'Design', value: 'Compact portable outdoor speaker' },
    ],
    tags: ['soundcore', 'speaker', 'boom-2-se', 'bluetooth', 'official'],
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Add it to .env.local before running this script.')
  }

  const imageDir = path.join(process.cwd(), 'public', 'catalog', 'official')
  await fs.mkdir(imageDir, { recursive: true })

  const activeBatch = batch.filter((item) => !item.sku.startsWith('SPK-JBL-'))
  let updated = 0
  let failed = 0

  for (const item of activeBatch) {
    try {
      const [product] = await db
        .select({ id: products.id, tags: products.tags, name: products.name, images: products.images })
        .from(products)
        .where(eq(products.sku, item.sku))
        .limit(1)

      if (!product) {
        console.warn(`Missing product for SKU ${item.sku}`)
        failed += 1
        continue
      }

      const meta = await fetchMeta(item.officialUrl)
      const chosenImage = item.imageUrl ?? meta.image
      const localImage = chosenImage ? await downloadImage(chosenImage, slugify(item.sku), imageDir) : null
      const mergedTags = Array.from(new Set([...(Array.isArray(product.tags) ? product.tags : []), ...(item.tags ?? [])]))

      const nextImages = localImage ? [localImage] : (Array.isArray(product.images) ? product.images : [])
      await db.execute(sql`
        update products
        set
          short_description = ${item.shortDescription},
          description = ${item.description},
          specs = ${JSON.stringify(item.specs)}::json,
          images = ${JSON.stringify(nextImages)}::json,
          tags = ${JSON.stringify(mergedTags)}::json,
          updated_at = now()
        where id = ${product.id}
      `)

      updated += 1
      console.log(`Updated ${item.sku} -> ${product.name}`)
    } catch (error) {
      failed += 1
      console.error(`Failed ${item.sku}:`, error)
    }
  }

  console.log(`Official enrichment batch complete: ${updated} products updated, ${failed} skipped or failed.`)
}

async function fetchMeta(url: string): Promise<{ title: string | null; description: string | null; image: string | null }> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch official page ${url}: ${res.status}`)
  }

  const html = await res.text()
  return {
    title: pickMeta(html, ['og:title']) ?? matchTitle(html),
    description: pickMeta(html, ['description', 'og:description', 'twitter:description']),
    image: normalizeUrl(url, pickMeta(html, ['og:image', 'twitter:image']) ?? extractJsonLdImage(html)),
  }
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

function matchTitle(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtml(match[1]) : null
}

function extractJsonLdImage(html: string): string | null {
  const imageMatch = html.match(/"contentUrl":"([^"]+\.(?:png|jpg|jpeg|webp)[^"]*)"/i)
  if (imageMatch?.[1]) return imageMatch[1].replace(/\\\//g, '/')
  return null
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function normalizeUrl(baseUrl: string, imageUrl: string | null): string | null {
  if (!imageUrl) return null
  try {
    return new URL(imageUrl, baseUrl).toString()
  } catch {
    return imageUrl
  }
}

async function downloadImage(url: string, fileStem: string, imageDir: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to download image ${url}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  const ext = extensionFrom(contentType, url)
  const fileName = `${fileStem}.${ext}`
  const absolutePath = path.join(imageDir, fileName)
  const arrayBuffer = await res.arrayBuffer()
  await fs.writeFile(absolutePath, Buffer.from(arrayBuffer))
  return `/catalog/official/${fileName}`
}

function extensionFrom(contentType: string, url: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
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
