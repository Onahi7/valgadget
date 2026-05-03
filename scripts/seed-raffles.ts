import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { raffles, shippingRates } from '../lib/server/schema'

const RAFFLES = [
  {
    title: 'Win an iPhone 15 Pro Max 256GB',
    description: 'Enter for a chance to win the ultimate iPhone. Top-tier camera, titanium design, and blazing-fast A17 Pro chip. One lucky winner takes it all.',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    prize: 'Apple iPhone 15 Pro Max 256GB',
    prizeValue: '1880000',
    ticketPrice: '2000',
    maxTickets: 1000,
    soldTickets: 347,
    status: 'active' as const,
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Win a Sony PlayStation 5 Slim',
    description: 'Get your hands on the latest PS5 Slim console. Experience next-gen gaming with ultra-high speed SSD, ray tracing, and 4K graphics.',
    image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=800&q=80',
    prize: 'Sony PlayStation 5 Slim Console',
    prizeValue: '890000',
    ticketPrice: '1500',
    maxTickets: 600,
    soldTickets: 213,
    status: 'active' as const,
    drawDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Win a DJI Mini 4 Pro Drone',
    description: 'Take your content to new heights. The DJI Mini 4 Pro captures stunning 4K/60fps footage with omnidirectional obstacle sensing.',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80',
    prize: 'DJI Mini 4 Pro Drone',
    prizeValue: '1650000',
    ticketPrice: '3000',
    maxTickets: 500,
    soldTickets: 89,
    status: 'active' as const,
    drawDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const NIGERIAN_STATES = [
  { state: 'Lagos', price: '1500', estimatedDays: 1 },
  { state: 'Abuja (FCT)', price: '2000', estimatedDays: 2 },
  { state: 'Rivers', price: '2500', estimatedDays: 3 },
  { state: 'Kano', price: '3000', estimatedDays: 4 },
  { state: 'Oyo', price: '2000', estimatedDays: 2 },
  { state: 'Kaduna', price: '3000', estimatedDays: 4 },
  { state: 'Delta', price: '2500', estimatedDays: 3 },
  { state: 'Anambra', price: '2500', estimatedDays: 3 },
  { state: 'Edo', price: '2500', estimatedDays: 3 },
  { state: 'Enugu', price: '2500', estimatedDays: 3 },
  { state: 'Cross River', price: '3000', estimatedDays: 4 },
  { state: 'Akwa Ibom', price: '3000', estimatedDays: 4 },
  { state: 'Imo', price: '2500', estimatedDays: 3 },
  { state: 'Abia', price: '2500', estimatedDays: 3 },
  { state: 'Osun', price: '2000', estimatedDays: 2 },
  { state: 'Ogun', price: '1500', estimatedDays: 2 },
  { state: 'Ondo', price: '2000', estimatedDays: 3 },
  { state: 'Ekiti', price: '2500', estimatedDays: 3 },
  { state: 'Kwara', price: '2500', estimatedDays: 3 },
  { state: 'Niger', price: '3000', estimatedDays: 4 },
  { state: 'Benue', price: '3000', estimatedDays: 4 },
  { state: 'Kogi', price: '3000', estimatedDays: 4 },
  { state: 'Nassarawa', price: '2500', estimatedDays: 3 },
  { state: 'Plateau', price: '3000', estimatedDays: 4 },
  { state: 'Bauchi', price: '3500', estimatedDays: 5 },
  { state: 'Gombe', price: '3500', estimatedDays: 5 },
  { state: 'Adamawa', price: '4000', estimatedDays: 5 },
  { state: 'Taraba', price: '4000', estimatedDays: 5 },
  { state: 'Borno', price: '4500', estimatedDays: 6 },
  { state: 'Yobe', price: '4500', estimatedDays: 6 },
  { state: 'Jigawa', price: '3500', estimatedDays: 5 },
  { state: 'Katsina', price: '3500', estimatedDays: 5 },
  { state: 'Sokoto', price: '4000', estimatedDays: 5 },
  { state: 'Kebbi', price: '4000', estimatedDays: 5 },
  { state: 'Zamfara', price: '4000', estimatedDays: 5 },
  { state: 'Bayelsa', price: '3000', estimatedDays: 4 },
  { state: 'Ebonyi', price: '2500', estimatedDays: 3 },
]

async function run() {
  // Insert raffles
  const existing = await db.select({ id: raffles.id }).from(raffles).limit(1)
  if (existing.length === 0) {
    await db.insert(raffles).values(RAFFLES.map(r => ({
      ...r,
      drawDate: new Date(r.drawDate),
    })))
    console.log(`Seeded ${RAFFLES.length} raffles`)
  } else {
    console.log('Raffles already exist, skipping')
  }

  // Insert shipping rates
  const existingRates = await db.select({ state: shippingRates.state }).from(shippingRates).limit(1)
  if (existingRates.length === 0) {
    await db.insert(shippingRates).values(NIGERIAN_STATES)
    console.log(`Seeded ${NIGERIAN_STATES.length} shipping rates`)
  } else {
    console.log('Shipping rates already exist, skipping')
  }

  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
