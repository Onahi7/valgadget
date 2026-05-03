import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { userAddresses } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and, desc } from 'drizzle-orm'

// GET /api/addresses - List user's saved addresses
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const addresses = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, auth.user.sub))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt))

    return apiOk({ data: addresses })
  } catch (err) {
    console.error('[get addresses]', err)
    return apiError('Failed to fetch addresses.', 500)
  }
}

// POST /api/addresses - Create new address
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const body = await req.json()
    const { label, fullName, line1, line2, city, state, postalCode, country, phone, isDefault } = body

    if (!label || !fullName || !line1 || !city || !state || !phone) {
      return apiError('Required fields: label, fullName, line1, city, state, phone')
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(userAddresses.userId, auth.user.sub))
    }

    const [address] = await db
      .insert(userAddresses)
      .values({
        userId: auth.user.sub,
        label,
        fullName,
        line1,
        line2,
        city,
        state,
        postalCode: postalCode || '',
        country: country || 'NG',
        phone,
        isDefault: isDefault || false,
      })
      .returning()

    return apiOk(address, 201)
  } catch (err) {
    console.error('[create address]', err)
    return apiError('Failed to create address.', 500)
  }
}
