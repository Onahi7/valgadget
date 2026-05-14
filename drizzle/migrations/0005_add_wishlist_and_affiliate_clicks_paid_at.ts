import { sql } from 'drizzle-orm'

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE affiliate_clicks
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

    CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS wishlists_user_idx ON wishlists(user_id);
    CREATE INDEX IF NOT EXISTS wishlists_product_idx ON wishlists(product_id);
    CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_idx ON wishlists(user_id, product_id);
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS wishlists;

    ALTER TABLE affiliate_clicks
    DROP COLUMN IF EXISTS paid_at;
  `)
}
