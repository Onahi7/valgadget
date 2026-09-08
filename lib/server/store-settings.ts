import { inArray } from 'drizzle-orm'
import { db } from '@/lib/server/db'
import { siteSettings } from '@/lib/server/schema'
import {
  mergeStoreSettings,
  STORE_SETTING_KEYS,
  type StoreSettingKey,
  type StoreSettings,
} from '@/lib/store-settings'
import { unstable_cache } from 'next/cache'

async function loadStoreSettings(): Promise<StoreSettings> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    const query = db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, STORE_SETTING_KEYS))

    const rows = await Promise.race([
      query,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Store settings query timed out')), 2_500)
      }),
    ])

    const values: Partial<Record<StoreSettingKey, string>> = {}
    for (const row of rows) values[row.key as StoreSettingKey] = row.value
    return mergeStoreSettings(values)
  } catch {
    return mergeStoreSettings({})
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export const getStoreSettings = unstable_cache(loadStoreSettings, ['store-settings-v1'], {
  revalidate: 60,
  tags: ['store-settings'],
})
