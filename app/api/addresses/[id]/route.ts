import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { userAddresses } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq, and } from 'drizzle-orm'

// GET /api/addresses/[id] - Get single address
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const { id } = await params
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, auth.user.sub)))
      .limit(1)

    if (!address) return apiError('Address not found.', 404)

    return apiOk(address)
  } catch (err) {
    console.error('[get address]', err)
    return apiError('Failed to fetch address.', 500)
  }
}

// PATCH /api/addresses/[id] - Update address
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const { label, fullName, line1, line2, city, state, postalCode, country, phone, isDefault } = body

    // Verify ownership
    const [existing] = await db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, auth.user.sub)))
      .limit(1)

    if (!existing) return apiError('Address not found.', 404)

    // If setting as default, unset other defaults first
    if (isDefault && !existing.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(userAddresses.userId, auth.user.sub), eq(userAddresses.isDefault, true)))
    }

    const [updated] = await db
      .update(userAddresses)
      .set({
        label: label ?? existing.label,
        fullName: fullName ?? existing.fullName,
        line1: line1 ?? existing.line1,
        line2: line2 !== undefined ? line2 : existing.line2,
        city: city ?? existing.city,
        state: state ?? existing.state,
        postalCode: postalCode !== undefined ? postalCode : existing.postalCode,
        country: country ?? existing.country,
        phone: phone ?? existing.phone,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(userAddresses.id, id))
      .returning()

    return apiOk(updated)
  } catch (err) {
    console.error('[update address]', err)
    return apiError('Failed to update address.', 500)
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if ('status' in auth) return auth

  try {
    const { id } = await params

    // Verify ownership
    const [existing] = await db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, auth.user.sub)))
      .limit(1)

    if (!existing) return apiError('Address not found.', 404)

    await db.delete(userAddresses).where(eq(userAddresses.id, id))

    return apiOk({ message: 'Address deleted successfully.' })
  } catch (err) {
    console.error('[delete address]', err)
    return apiError('Failed to delete address.', 500)
  }
}
