import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { categories } from '../lib/server/schema'
import { sql } from 'drizzle-orm'

async function main() {
  const rows = await db.select({ name: categories.name, slug: categories.slug, parentId: categories.parentId, isActive: categories.isActive }).from(categories)
  const children = rows.filter(r => r.parentId)
  const inactiveChildren = children.filter(r => !r.isActive)
  console.log(JSON.stringify({ total: rows.length, children: children.length, inactiveChildren: inactiveChildren.length, sampleChildren: children.slice(0,15) }, null, 2))
}
main().catch(e=>{console.error(e);process.exit(1)})
