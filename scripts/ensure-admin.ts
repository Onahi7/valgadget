import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const email = (process.env.ADMIN_EMAIL ?? 'admin@valgadget.ng').trim().toLowerCase()
const name = (process.env.ADMIN_NAME ?? 'ValGadget Admin').trim()
const password = process.env.ADMIN_PASSWORD

if (!password || password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be set and must be at least 8 characters long.')
}
const adminPassword = password

async function main() {
  const [{ db }, { users }, { hashPassword }] = await Promise.all([
    import('../lib/server/db'),
    import('../lib/server/schema'),
    import('../lib/server/auth-helpers'),
  ])
  const passwordHash = await hashPassword(adminPassword)

  const [admin] = await db.insert(users)
    .values({
      email,
      name,
      passwordHash,
      role: 'admin',
      isVerified: true,
      verifyToken: null,
      resetToken: null,
      resetExpires: null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name,
        passwordHash,
        role: 'admin',
        isVerified: true,
        verifyToken: null,
        resetToken: null,
        resetExpires: null,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isVerified: users.isVerified,
    })

  console.log(JSON.stringify({ admin }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
