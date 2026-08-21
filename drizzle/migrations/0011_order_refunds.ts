import { sql } from 'drizzle-orm'

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reference TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE orders DROP COLUMN IF EXISTS refunded_at;
    ALTER TABLE orders DROP COLUMN IF EXISTS refund_status;
    ALTER TABLE orders DROP COLUMN IF EXISTS refund_reference;
    ALTER TABLE orders DROP COLUMN IF EXISTS refund_reason;
    ALTER TABLE orders DROP COLUMN IF EXISTS refund_amount;
  `)
}
