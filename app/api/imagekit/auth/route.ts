/**
 * ImageKit — upload auth endpoint.
 * Browser SDK calls this to get a short-lived signature for direct uploads.
 */
import { NextRequest } from 'next/server'
import { getUploadAuth } from '@/lib/server/imagekit'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'

export async function GET(req: NextRequest) {
  // Only authenticated users can get upload credentials
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const auth = getUploadAuth()
    return apiOk(auth)
  } catch (err) {
    console.error('[imagekit auth]', err)
    return apiError('ImageKit not configured.', 503)
  }
}
