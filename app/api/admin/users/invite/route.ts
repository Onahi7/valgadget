/**
 * POST /api/admin/users/invite
 * Sends an invitation email to a new user.
 * Body: { email, role? }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/server/db'
import { users } from '@/lib/server/schema'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  try {
    const { email, role } = await req.json() as { email: string; role?: string }

    if (!email || !email.includes('@')) return apiError('Valid email is required', 400)

    const validRoles = ['customer', 'affiliate']
    if (role && !validRoles.includes(role)) return apiError('Invalid role. Use customer or affiliate.', 400)

    // Check if user already exists
    const [existing] = await db.select({ id: users.id })
      .from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)

    if (existing) return apiError('User with this email already exists', 409)

    // Send invitation email via Resend
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'ValGadget <noreply@valgadget.com>'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (resendKey && !resendKey.includes('placeholder')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `You're invited to join ValGadget${role === 'affiliate' ? ' as an affiliate' : ''}!`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#111">You're Invited!</h2>
              <p style="color:#555;font-size:15px">
                You've been invited to join ValGadget${role === 'affiliate' ? ' as an affiliate partner' : ''}.
              </p>
              <p style="margin:24px 0">
                <a href="${appUrl}/register${role === 'affiliate' ? '?role=affiliate' : ''}"
                   style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                  Create Your Account
                </a>
              </p>
              <p style="color:#888;font-size:13px">If you didn't expect this invitation, you can ignore this email.</p>
            </div>
          `,
        }),
      })
    }

    return apiOk({ invited: email, role: role ?? 'customer' })
  } catch (err) {
    console.error('[admin/users/invite]', err)
    return apiError('Failed to send invitation', 500)
  }
}
