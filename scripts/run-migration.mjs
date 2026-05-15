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
    // ── Migration 0005: wishlist + affiliate_clicks.paid_at ──────────────
    await sql`ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;`

    await sql`CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`

    await sql`CREATE INDEX IF NOT EXISTS wishlists_user_idx ON wishlists(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS wishlists_product_idx ON wishlists(product_id);`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_unique ON wishlists(user_id, product_id);`

    // ── Migration 0006: Security & schema consistency fixes ──────────────

    // Categories: add self-referencing FK (only if no orphaned rows exist)
    await sql`
      UPDATE categories SET parent_id = NULL
      WHERE parent_id IS NOT NULL
        AND parent_id NOT IN (SELECT id FROM categories);
    `
    await sql`
      DO $$ BEGIN
        ALTER TABLE categories ADD CONSTRAINT categories_parent_id_fkey
          FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `

    // Raffle entries: add updated_at column
    await sql`ALTER TABLE raffle_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();`

    // Raffle entries: update user_id FK to ON DELETE CASCADE
    await sql`
      DO $$ BEGIN
        ALTER TABLE raffle_entries DROP CONSTRAINT raffle_entries_user_id_fkey;
        ALTER TABLE raffle_entries ADD CONSTRAINT raffle_entries_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `

    // Affiliate payouts table may not exist yet (created in migration 0003)
    const hasAffiliatePayouts = await sql`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_payouts');
    `
    if (hasAffiliatePayouts[0].exists) {
      // Affiliate payouts: update user_id FK to ON DELETE CASCADE
      await sql`
        DO $$ BEGIN
          ALTER TABLE affiliate_payouts DROP CONSTRAINT affiliate_payouts_user_id_fkey;
          ALTER TABLE affiliate_payouts ADD CONSTRAINT affiliate_payouts_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        EXCEPTION WHEN undefined_object THEN NULL;
        END $$;
      `

      // Affiliate payouts: update admin_id FK to ON DELETE SET NULL
      await sql`
        DO $$ BEGIN
          ALTER TABLE affiliate_payouts DROP CONSTRAINT affiliate_payouts_admin_id_fkey;
          ALTER TABLE affiliate_payouts ADD CONSTRAINT affiliate_payouts_admin_id_fkey
            FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN undefined_object THEN NULL;
        END $$;
      `
    }

    // Affiliate clicks: update user_id FK to ON DELETE SET NULL
    await sql`
      DO $$ BEGIN
        ALTER TABLE affiliate_clicks DROP CONSTRAINT affiliate_clicks_user_id_fkey;
        ALTER TABLE affiliate_clicks ADD CONSTRAINT affiliate_clicks_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `

    // Affiliate clicks: update order_id FK to ON DELETE SET NULL
    await sql`
      DO $$ BEGIN
        ALTER TABLE affiliate_clicks DROP CONSTRAINT affiliate_clicks_order_id_fkey;
        ALTER TABLE affiliate_clicks ADD CONSTRAINT affiliate_clicks_order_id_fkey
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `

    console.log('All migrations applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

main()
