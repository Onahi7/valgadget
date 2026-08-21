import { sql } from 'drizzle-orm'

/** Create the refresh-token store required by cookie authentication. */
export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON refresh_tokens(token_hash);
  `)
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS refresh_tokens;`)
}
