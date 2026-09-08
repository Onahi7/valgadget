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
  _db = drizzle(new Pool({
    connectionString: url,
    // Fail quickly enough for withDbRetry to recover before the browser request times out.
    connectionTimeoutMillis: 8_000,
  }), { schema })
  return _db
}

// Proxy so call-sites can write `db.select()...` without calling getDb() themselves.
export const db: NeonDatabase<Schema> = new Proxy({} as NeonDatabase<Schema>, {
  get(_t, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

const TRANSIENT_DATABASE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
])

function isTransientDatabaseError(error: unknown): boolean {
  const pending: unknown[] = [error]
  const seen = new Set<unknown>()

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || seen.has(current)) continue
    seen.add(current)

    if (typeof current === 'object') {
      const candidate = current as {
        code?: unknown
        message?: unknown
        type?: unknown
        cause?: unknown
        errors?: unknown
      }

      if (typeof candidate.code === 'string' && TRANSIENT_DATABASE_CODES.has(candidate.code)) {
        return true
      }

      // The ws package wraps low-level ECONNRESET failures in an ErrorEvent and
      // exposes the original error through a symbol rather than `.cause`.
      if (candidate.type === 'error') return true

      if (
        typeof candidate.message === 'string'
        && /connection terminated|connection timeout|fetch failed|socket hang up|websocket.*closed/i.test(candidate.message)
      ) {
        return true
      }

      if (candidate.cause) pending.push(candidate.cause)
      if (Array.isArray(candidate.errors)) pending.push(...candidate.errors)
    }
  }

  return false
}

/** Retry a database operation once when Neon reports a transient network failure. */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, 250))
    return operation()
  }
}
