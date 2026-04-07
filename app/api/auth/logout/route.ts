import { ok } from '@/lib/server/http'

// JWT is stateless — client drops the token.
// If you use httpOnly cookies, clear them here.
export async function POST() {
  return ok({ message: 'Logged out successfully.' })
}
