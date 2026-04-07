/**
 * Neon Postgres connection via @neondatabase/serverless
 * Only imported in server components / route handlers — never in client code.
 *
 * The client is created lazily on first use so Next.js can build the app even
 * when DATABASE_URL is missing from the build environment.
 */
import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Schema = typeof schema

let _db: NeonHttpDatabase<Schema> | undefined

export function getDb(): NeonHttpDatabase<Schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Add it to your .env.local file.')
  _db = drizzle(neon(url), { schema })
  return _db
}

// Proxy so call-sites can write `db.select()...` without calling getDb() themselves.
export const db: NeonHttpDatabase<Schema> = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(_t, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
