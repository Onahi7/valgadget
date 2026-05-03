import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { inArray } from 'drizzle-orm'

const skus=['COM-APL-IP15-128','COM-APL-IPAD10-64','WEA-APL-WSE2','COM-APL-IP15PM-256','COM-APL-IP14-128','COM-APL-IP13-128']
async function main(){
 const rows=await db.select({name:products.name,sku:products.sku,images:products.images}).from(products).where(inArray(products.sku,skus))
 console.log(JSON.stringify(rows,null,2))
}
main().catch(e=>{console.error(e);process.exit(1)})
