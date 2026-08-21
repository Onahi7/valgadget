import { apiError, apiOk } from '@/lib/server/auth-helpers'
import { getStoreSettings } from '@/lib/server/store-settings'
import { toPublicStoreConfig } from '@/lib/store-settings'

export async function GET() {
  try {
    const settings = await getStoreSettings()
    return apiOk(toPublicStoreConfig(settings))
  } catch (error) {
    console.error('[store-config GET]', error)
    return apiError('Store configuration is temporarily unavailable.', 500)
  }
}
