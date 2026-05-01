import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products, categories } from '../lib/server/schema'
import { and, eq, sql } from 'drizzle-orm'

async function countFor(categoryParam: string) {
  const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categoryParam)).limit(1)
  const where = and(eq(products.isActive, true), eq(products.categoryId, cat?.id ?? categoryParam))
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(products).where(where)
  return c
}

async function main() {
  const slugs = ['power-charging', 'audio-entertainment', 'computing-accessories']
  const out: Record<string, number> = {}
  for (const s of slugs) out[s] = await countFor(s)
  console.log(JSON.stringify(out, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
