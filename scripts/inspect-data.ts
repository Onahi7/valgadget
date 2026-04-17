import { db } from '../lib/server/db.ts'
import { users, categories, products, raffles, shippingRates } from '../lib/server/schema.ts'

async function main() {
  console.log('=== USERS ===')
  const u = await db.select().from(users)
  u.forEach(x => console.log(`  ${x.id} | ${x.email} | ${x.role} | verified=${x.isVerified} | affCode=${x.affiliateCode}`))

  console.log('\n=== CATEGORIES ===')
  const c = await db.select().from(categories)
  c.forEach(x => console.log(`  ${x.id} | ${x.name} | ${x.slug} | active=${x.isActive}`))

  console.log('\n=== PRODUCTS (first 5) ===')
  const p = await db.select().from(products).limit(5)
  p.forEach(x => console.log(`  ${x.id} | ${x.name} | ₦${x.price} | stock=${x.stock} | catId=${x.categoryId}`))

  console.log('\n=== RAFFLES ===')
  const r = await db.select().from(raffles)
  r.forEach(x => console.log(`  ${x.id} | ${x.title} | status=${x.status} | sold=${x.soldTickets}/${x.maxTickets}`))

  console.log('\n=== SHIPPING RATES (first 5) ===')
  const s = await db.select().from(shippingRates).limit(5)
  s.forEach(x => console.log(`  ${x.state} | ₦${x.price} | ${x.estimatedDays}d | active=${x.isActive}`))

  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
