import 'dotenv/config'
import { db } from '../lib/server/db'
import { users } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.role, 'admin'))
  console.log(JSON.stringify(rows, null, 2))
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
