import 'dotenv/config'
import { db } from '../lib/server/db'
import { users } from '../lib/server/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'admin@valgadget.ng'
  const newPassword = 'Admin@val2026'
  const hash = await bcrypt.hash(newPassword, 12)

  const result = await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email })

  if (result.length === 0) {
    console.error('No user found with that email')
    process.exit(1)
  }

  console.log(`Password updated for ${result[0].email} (${result[0].id})`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
