import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'

// Load env vars from .env.local if present
dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env.local or your environment.')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function main() {
  try {
    await sql`ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;`

    await sql`CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`

    await sql`CREATE INDEX IF NOT EXISTS wishlists_user_idx ON wishlists(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS wishlists_product_idx ON wishlists(product_id);`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_idx ON wishlists(user_id, product_id);`

    console.log('Migration applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

main()
