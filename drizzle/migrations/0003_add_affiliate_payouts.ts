import { sql } from 'drizzle-orm'

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES users(id),
      amount NUMERIC(10,2) NOT NULL,
      method VARCHAR(50) NOT NULL,
      reference TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'completed',
      admin_id TEXT REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS affiliate_payouts_user_idx ON affiliate_payouts(user_id);
    CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON affiliate_payouts(status);
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS affiliate_payouts;
  `)
}
