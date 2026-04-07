/**
 * Seed script — inserts demo categories, products, and raffles into Neon.
 * Run with:  npx tsx scripts/seed.ts
 *
 * Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING so existing rows
 * are never overwritten.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'
import * as schema from '../lib/server/schema'

const db = drizzle(neon(process.env.DATABASE_URL!), { schema })

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES: (typeof schema.categories.$inferInsert)[] = [
  { id: 'cat-1', name: 'Audio',       slug: 'audio',       description: 'Headphones, speakers, and earbuds',        isActive: true, sortOrder: 1 },
  { id: 'cat-2', name: 'Wearables',   slug: 'wearables',   description: 'Smartwatches and fitness trackers',         isActive: true, sortOrder: 2 },
  { id: 'cat-3', name: 'Cameras',     slug: 'cameras',     description: 'Action cams, drones, and lenses',           isActive: true, sortOrder: 3 },
  { id: 'cat-4', name: 'Computing',   slug: 'computing',   description: 'Laptops, tablets, and accessories',         isActive: true, sortOrder: 4 },
  { id: 'cat-5', name: 'Smart Home',  slug: 'smart-home',  description: 'Automation, lighting, and security',        isActive: true, sortOrder: 5 },
  { id: 'cat-6', name: 'Gaming',      slug: 'gaming',      description: 'Controllers, headsets, and gear',           isActive: true, sortOrder: 6 },
]

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCTS: (typeof schema.products.$inferInsert)[] = [
  {
    id: 'p-1', name: 'SonicPro X1 Headphones', slug: 'sonicpro-x1',
    description: 'Industry-leading noise cancellation meets studio-quality audio. 40-hour battery, adaptive EQ, and premium leather cushions.',
    shortDescription: '40-hr ANC headphones with studio-quality audio.',
    price: '349', comparePrice: '429', categoryId: 'cat-1',
    stock: 42, sku: 'SPX1-BLK', rating: '4.8', reviewCount: 312,
    tags: ['featured', 'bestseller'], featured: true, isNew: false, isActive: true,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
    ],
    createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'p-2', name: 'VisionWatch Pro 5', slug: 'visionwatch-pro-5',
    description: 'Advanced health monitoring with ECG, SpO2, and GPS. Titanium frame, sapphire glass, 7-day battery life.',
    shortDescription: 'Premium smartwatch with ECG, GPS & 7-day battery.',
    price: '599', comparePrice: '699', categoryId: 'cat-2',
    stock: 28, sku: 'VWP5-SLV', rating: '4.7', reviewCount: 189,
    tags: ['featured', 'new'], featured: true, isNew: true, isActive: true,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
    createdAt: new Date('2024-05-01'), updatedAt: new Date('2024-05-01'),
  },
  {
    id: 'p-3', name: 'AeroCapture 4K Drone', slug: 'aerocapture-4k',
    description: '4K/60fps with 3-axis gimbal stabilization. 35-minute flight time, obstacle avoidance, and follow-me mode.',
    shortDescription: '4K/60fps drone with gimbal & obstacle avoidance.',
    price: '899', categoryId: 'cat-3',
    stock: 15, sku: 'AC4K-GRY', rating: '4.6', reviewCount: 94,
    tags: ['premium'], featured: true, isNew: false, isActive: true,
    images: ['https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80'],
    createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'p-4', name: 'NexPad Ultra Tablet', slug: 'nexpad-ultra',
    description: '12.9" OLED display, M3 chip, and all-day battery. Perfect for creatives and power users.',
    shortDescription: '12.9" OLED tablet with M3 chip.',
    price: '1199', categoryId: 'cat-4',
    stock: 20, sku: 'NPU-256', rating: '4.9', reviewCount: 267,
    tags: ['premium', 'bestseller'], featured: false, isNew: true, isActive: true,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80'],
    createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'p-5', name: 'HaloHub Smart Speaker', slug: 'halohub-speaker',
    description: 'Room-filling 360° sound with built-in AI assistant, multi-room audio, and sleek matte finish.',
    shortDescription: '360° smart speaker with AI assistant.',
    price: '199', comparePrice: '249', categoryId: 'cat-5',
    stock: 60, sku: 'HHS-BLK', rating: '4.5', reviewCount: 445,
    tags: ['bestseller'], featured: false, isNew: false, isActive: true,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&q=80'],
    createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'p-6', name: 'PixelBuds Pro 2', slug: 'pixelbuds-pro-2',
    description: 'True wireless earbuds with adaptive ANC, 8-hour playback, and ultra-fast charging case.',
    shortDescription: 'True wireless ANC earbuds, 8-hr battery.',
    price: '229', categoryId: 'cat-1',
    stock: 85, sku: 'PBP2-WHT', rating: '4.6', reviewCount: 521,
    tags: ['new', 'bestseller'], featured: true, isNew: true, isActive: true,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'],
    createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01'),
  },
  {
    id: 'p-7', name: 'GameShift Controller X', slug: 'gameshift-controller-x',
    description: 'Pro-grade haptics, adjustable triggers, and 20-hour wireless battery. Compatible with all platforms.',
    shortDescription: 'Pro wireless controller, 20-hr battery.',
    price: '129', comparePrice: '159', categoryId: 'cat-6',
    stock: 100, sku: 'GSX-BLK', rating: '4.7', reviewCount: 788,
    tags: ['bestseller'], featured: false, isNew: false, isActive: true,
    images: ['https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=600&q=80'],
    createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'p-8', name: 'LumiCam Action Cam', slug: 'lumicam-action',
    description: 'Waterproof to 30m, 5K stabilized video, and 2-hour recording. Designed for the fearless.',
    shortDescription: 'Waterproof 5K action cam, 2-hr recording.',
    price: '449', categoryId: 'cat-3',
    stock: 33, sku: 'LAC-ORG', rating: '4.4', reviewCount: 156,
    tags: ['new'], featured: false, isNew: true, isActive: true,
    images: ['https://images.unsplash.com/photo-1530053969600-caed2596d242?w=600&q=80'],
    createdAt: new Date('2024-08-01'), updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'p-9', name: 'FlexCore Laptop Stand', slug: 'flexcore-stand',
    description: 'Adjustable aluminium stand with cable management. Fits all laptops 11–17".',
    shortDescription: 'Adjustable aluminium laptop stand.',
    price: '69', comparePrice: '89', categoryId: 'cat-4',
    stock: 0, sku: 'FCS-ALU', rating: '4.3', reviewCount: 203,
    tags: [], featured: false, isNew: false, isActive: true,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80'],
    createdAt: new Date('2024-04-01'), updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'p-10', name: 'NovaCam 360 Security', slug: 'novacam-360',
    description: '4K 360° indoor/outdoor security camera with AI detection and 2-way audio.',
    shortDescription: '4K 360° security camera with AI detection.',
    price: '189', comparePrice: '219', categoryId: 'cat-5',
    stock: 47, sku: 'NC360-WHT', rating: '4.5', reviewCount: 334,
    tags: ['new'], featured: false, isNew: true, isActive: true,
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80'],
    createdAt: new Date('2024-09-01'), updatedAt: new Date('2024-09-01'),
  },
]

// ─── Raffles ──────────────────────────────────────────────────────────────────

const RAFFLES: (typeof schema.raffles.$inferInsert)[] = [
  {
    id: 'r-1',
    title: 'Win the SonicPro X1 Bundle',
    slug: 'win-sonicpro-x1-bundle',
    description: 'Enter for a chance to win our flagship headphones + accessories worth $600. Only 500 tickets available.',
    prize: 'SonicPro X1 + Full Accessory Bundle',
    prizeValue: '600', ticketPrice: '5', maxTickets: 500, soldTickets: 342,
    status: 'active',
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
    createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01'),
  },
  {
    id: 'r-2',
    title: 'AeroCapture 4K Drone Raffle',
    slug: 'aerocapture-4k-drone-raffle',
    description: 'Win the pro drone kit including extra batteries, filters, and carrying case.',
    prize: 'AeroCapture 4K Drone Kit',
    prizeValue: '1200', ticketPrice: '10', maxTickets: 200, soldTickets: 187,
    status: 'active',
    drawDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    images: ['https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80'],
    createdAt: new Date('2024-07-10'), updatedAt: new Date('2024-07-10'),
  },
  {
    id: 'r-3',
    title: 'VisionWatch Pro 5 Giveaway',
    slug: 'visionwatch-pro-5-giveaway',
    description: 'The premium smartwatch that does it all. One lucky winner takes home this $699 flagship watch.',
    prize: 'VisionWatch Pro 5 (Titanium)',
    prizeValue: '699', ticketPrice: '8', maxTickets: 300, soldTickets: 89,
    status: 'upcoming',
    drawDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
    createdAt: new Date('2024-08-01'), updatedAt: new Date('2024-08-01'),
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database...\n')

  // Categories
  console.log('📁 Inserting categories...')
  for (const cat of CATEGORIES) {
    await db.insert(schema.categories).values(cat).onConflictDoNothing()
    console.log(`   ✓ ${cat.name}`)
  }

  // Products
  console.log('\n📦 Inserting products...')
  for (const product of PRODUCTS) {
    await db.insert(schema.products).values(product).onConflictDoNothing()
    console.log(`   ✓ ${product.name}`)
  }

  // Raffles
  console.log('\n🎟️  Inserting raffles...')
  for (const raffle of RAFFLES) {
    await db.insert(schema.raffles).values(raffle).onConflictDoNothing()
    console.log(`   ✓ ${raffle.title}`)
  }

  console.log('\n✅ Seed complete!')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
