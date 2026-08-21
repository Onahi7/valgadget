import { sql } from 'drizzle-orm'

/** Persist order shipment details as first-class fields. */
export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(200);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE orders DROP COLUMN IF EXISTS tracking_url;
    ALTER TABLE orders DROP COLUMN IF EXISTS tracking_number;
  `)
}
