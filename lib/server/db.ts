/**
 * Neon Postgres connection via @neondatabase/serverless.
 * Only imported in server components / route handlers, never in client code.
 *
 * The pooled serverless driver is used because checkout needs real
 * interactive transactions for stock and idempotency safety.
 */
import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema'

type Schema = typeof schema

neonConfig.webSocketConstructor = ws

let _db: NeonDatabase<Schema> | undefined

export function getDb(): NeonDatabase<Schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Add it to your .env.local file.')
  _db = drizzle(new Pool({ connectionString: url }), { schema })
  return _db
}

// Proxy so call-sites can write `db.select()...` without calling getDb() themselves.
export const db: NeonDatabase<Schema> = new Proxy({} as NeonDatabase<Schema>, {
  get(_t, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
