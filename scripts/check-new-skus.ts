import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { sql, inArray } from 'drizzle-orm'

const skus=['COM-APL-IP15PM-256','COM-APL-IP14-128','COM-APL-IP13-128','COM-RDM-N13-256','COM-SAM-A55-5G','COM-TEC-CAMON30']

async function main(){
 const all=await db.select({sku:products.sku,isActive:products.isActive,images:products.images}).from(products).where(inArray(products.sku,skus))
 const [{c:total}] = await db.select({c: sql<number>`count(*)::int`}).from(products)
 const [{c:active}] = await db.select({c: sql<number>`count(*)::int`}).from(products).where(sql`${products.isActive}=true`)
 console.log(JSON.stringify({total,active,all},null,2))
}
main().catch(e=>{console.error(e);process.exit(1)})
