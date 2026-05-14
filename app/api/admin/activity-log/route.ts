import { NextRequest } from 'next/server'
import { requireAuth, apiOk } from '@/lib/server/auth-helpers'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  return apiOk({ data: [], total: 0 })
}
