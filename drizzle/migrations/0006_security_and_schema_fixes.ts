import { sql } from 'drizzle-orm'

/**
 * Migration 006: Security & schema consistency fixes
 * - Add FK constraints to categories.parent_id
 * - Add ON DELETE CASCADE to raffle_entries.user_id
 * - Add ON DELETE CASCADE to affiliate_payouts.user_id
 * - Add ON DELETE SET NULL to affiliate_payouts.admin_id
 * - Add ON DELETE SET NULL to affiliate_clicks.user_id and order_id
 * - Add updated_at to raffle_entries
 * - Add unique index on wishlists(user_id, product_id)
 */
export async function up(db: any) {
  await db.execute(sql`
    -- Categories: add self-referencing FK
    ALTER TABLE categories
    ADD CONSTRAINT categories_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

    -- Raffle entries: add ON DELETE CASCADE to user_id
    ALTER TABLE raffle_entries
    DROP CONSTRAINT IF EXISTS raffle_entries_user_id_fkey,
    ADD CONSTRAINT raffle_entries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    -- Raffle entries: add updated_at column
    ALTER TABLE raffle_entries
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

    -- Affiliate payouts: add ON DELETE CASCADE to user_id
    ALTER TABLE affiliate_payouts
    DROP CONSTRAINT IF EXISTS affiliate_payouts_user_id_fkey,
    ADD CONSTRAINT affiliate_payouts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    -- Affiliate payouts: add ON DELETE SET NULL to admin_id
    ALTER TABLE affiliate_payouts
    DROP CONSTRAINT IF EXISTS affiliate_payouts_admin_id_fkey,
    ADD CONSTRAINT affiliate_payouts_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

    -- Affiliate clicks: add ON DELETE SET NULL to user_id
    ALTER TABLE affiliate_clicks
    DROP CONSTRAINT IF EXISTS affiliate_clicks_user_id_fkey,
    ADD CONSTRAINT affiliate_clicks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    -- Affiliate clicks: add ON DELETE SET NULL to order_id
    ALTER TABLE affiliate_clicks
    DROP CONSTRAINT IF EXISTS affiliate_clicks_order_id_fkey,
    ADD CONSTRAINT affiliate_clicks_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

    -- Wishlists: add unique index (if not already present)
    CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_unique
    ON wishlists(user_id, product_id);
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    -- Drop unique index
    DROP INDEX IF EXISTS wishlists_user_product_unique;

    -- Restore FK constraints without ON DELETE
    ALTER TABLE affiliate_clicks
    DROP CONSTRAINT IF EXISTS affiliate_clicks_order_id_fkey,
    ADD CONSTRAINT affiliate_clicks_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

    ALTER TABLE affiliate_clicks
    DROP CONSTRAINT IF EXISTS affiliate_clicks_user_id_fkey,
    ADD CONSTRAINT affiliate_clicks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE affiliate_payouts
    DROP CONSTRAINT IF EXISTS affiliate_payouts_admin_id_fkey,
    ADD CONSTRAINT affiliate_payouts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users(id);

    ALTER TABLE affiliate_payouts
    DROP CONSTRAINT IF EXISTS affiliate_payouts_user_id_fkey,
    ADD CONSTRAINT affiliate_payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE raffle_entries
    DROP CONSTRAINT IF EXISTS raffle_entries_user_id_fkey,
    ADD CONSTRAINT raffle_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

    ALTER TABLE raffle_entries
    DROP COLUMN IF EXISTS updated_at;

    ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
  `)
}
