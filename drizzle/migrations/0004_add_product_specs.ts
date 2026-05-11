import { sql } from 'drizzle-orm'

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS specs JSON NOT NULL DEFAULT '[]'::json;
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE products
    DROP COLUMN IF EXISTS specs;
  `)
}
