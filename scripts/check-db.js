import { db } from '../lib/server/db.ts'
import { users, categories, products, orders, reviews, raffles, raffleEntries, affiliateClicks, shippingRates, siteSettings, chatSessions, chatMessages } from '../lib/server/schema.ts'
import { count } from 'drizzle-orm'

async function main() {
  const tables = [
    ['users', users], ['categories', categories], ['products', products],
    ['orders', orders], ['reviews', reviews], ['raffles', raffles],
    ['raffle_entries', raffleEntries], ['affiliate_clicks', affiliateClicks],
    ['shipping_rates', shippingRates], ['site_settings', siteSettings],
    ['chat_sessions', chatSessions], ['chat_messages', chatMessages],
  ]
  for (const [name, table] of tables) {
    try {
      const [{ cnt }] = await db.select({ cnt: count() }).from(table)
      console.log(`${name}: ${cnt} rows`)
    } catch (e) {
      console.log(`${name}: ERROR ${e.message}`)
    }
  }
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
