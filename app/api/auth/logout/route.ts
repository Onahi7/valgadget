import { apiOk } from '@/lib/server/auth-helpers'

// JWT is stateless — client drops the token.
// If you use httpOnly cookies, clear them here.
export async function POST() {
  return apiOk({ message: 'Logged out successfully.' })
}
