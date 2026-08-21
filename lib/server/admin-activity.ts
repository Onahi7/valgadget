import { db } from '@/lib/server/db'
import { adminActivityLogs } from '@/lib/server/schema'

export async function logAdminActivity(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: string | null,
) {
  try {
    await db.insert(adminActivityLogs).values({
      adminId,
      action: action.slice(0, 100),
      entityType: entityType.slice(0, 100),
      entityId: entityId || null,
      details: details?.slice(0, 2_000) || null,
    })
  } catch (error) {
    console.error('[admin activity]', error)
  }
}
