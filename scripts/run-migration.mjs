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

    // ── Migration 0007: Homepage section cover images ─────────────────────
    // Adds a separate cover_image column for the full-bleed Tech Direct style
    // section banners on the homepage. Existing `image` remains the category
    // icon/thumbnail.
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS cover_image TEXT;`

    // Add a `brand` column to products so the faceted filter sidebar can
    // group products by manufacturer. Backfill from tags where the first
    // tag matches a known brand pattern (uppercase letters only).
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);`
    await sql`CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand) WHERE brand IS NOT NULL;`

    // Backfill brand from the first tag that looks like a brand name
    await sql`
      UPDATE products
      SET brand = UPPER(t.tag)
      FROM (
        SELECT id, json_array_elements_text(tags) AS tag
        FROM products
        WHERE brand IS NULL
          AND json_array_length(tags) > 0
      ) AS t
      WHERE products.id = t.id
        AND t.tag ~ '^[A-Z][A-Z0-9 &.-]{1,30}$';
    `

    // ── Migration 0008: First-class product condition ────────────────────
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS condition VARCHAR(30) NOT NULL DEFAULT 'brand-new';`
    await sql`
      UPDATE products
      SET condition = CASE
        WHEN tags::jsonb ? 'uk-used' THEN 'uk-used'
        WHEN tags::jsonb ? 'us-used' THEN 'us-used'
        WHEN tags::jsonb ? 'naija-used' THEN 'naija-used'
        WHEN tags::jsonb ? 'refurbished' THEN 'refurbished'
        WHEN tags::jsonb ? 'open-box' THEN 'open-box'
        ELSE condition
      END;
    `
    await sql`
      UPDATE products p
      SET condition = 'uk-used'
      FROM categories c
      WHERE p.category_id = c.id
        AND c.slug = 'iphones-uk-used'
        AND p.condition = 'brand-new';
    `
    await sql`CREATE INDEX IF NOT EXISTS products_condition_idx ON products(condition);`

    // ── Migration 0009: Persisted order shipment tracking ────────────────
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(200);`
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;`

    // ── Migration 0010: Refresh-token persistence for cookie auth ────────
    await sql`CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`
    await sql`CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON refresh_tokens(token_hash);`

    // ── Migration 0011: Persisted admin activity log ─────────────────────
    await sql`CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`
    await sql`CREATE INDEX IF NOT EXISTS admin_activity_created_idx ON admin_activity_logs(created_at);`
    await sql`CREATE INDEX IF NOT EXISTS admin_activity_admin_idx ON admin_activity_logs(admin_id);`

    // ── Migration 0012: First-class refund audit fields ─────────────────
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);`
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;`
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reference TEXT;`
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30);`
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;`

    console.log('All migrations applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

main()
