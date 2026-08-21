import { sql } from 'drizzle-orm'

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS admin_activity_created_idx ON admin_activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS admin_activity_admin_idx ON admin_activity_logs(admin_id);
  `)
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS admin_activity_logs;`)
}
