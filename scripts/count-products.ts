import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { sql } from 'drizzle-orm'

async function main(){
 const [{c:total}] = await db.select({c: sql<number>`count(*)::int`}).from(products)
 const [{c:active}] = await db.select({c: sql<number>`count(*)::int`}).from(products).where(sql`${products.isActive}=true`)
 console.log(JSON.stringify({total,active}))
}
main().catch(e=>{console.error(e);process.exit(1)})
