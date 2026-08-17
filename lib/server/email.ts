/**
 * Resend email service — ValGadget
 * Server-only. Never import in client components.
 */
import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'ValGadget <noreply@valgadget.com>'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set.')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

/** Escape HTML entities to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ─── Generic send ──────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await getResend().emails.send({ from: FROM, to, subject, html })
}

/**
 * Fire-and-forget email with structured error logging.
 * Returns true if sent, false if failed.
 */
export async function safeSendEmail(to: string, subject: string, html: string, context = 'email'): Promise<boolean> {
  try {
    await sendEmail(to, subject, html)
    return true
  } catch (err) {
    console.error(`[${context}] Failed to send email to ${to}:`, err instanceof Error ? err.message : err)
    return false
  }
}

// ─── Auth emails ───────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/verify-email?token=${token}`

  await sendEmail(to, 'Verify your ValGadget email', `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#1a1a1a;margin:0 0 8px;">Hi ${escapeHtml(name)}</h2>
      <p style="color:#555;line-height:1.6;">Thanks for signing up for <strong>ValGadget</strong>. 
         Click the button below to verify your email address.</p>
      <a href="${url}" 
         style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e8610a;
                color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        Verify Email
      </a>
      <p style="color:#999;font-size:13px;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    </div>
  `)
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/reset-password?token=${token}`

  await sendEmail(to, 'Reset your ValGadget password', `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#1a1a1a;margin:0 0 8px;">Password reset</h2>
      <p style="color:#555;line-height:1.6;">Hi ${escapeHtml(name)}, we received a request to reset your 
         <strong>ValGadget</strong> password.</p>
      <a href="${url}"
         style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e8610a;
                color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        Reset Password
      </a>
      <p style="color:#999;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore the email.</p>
    </div>
  `)
}

// ─── Order emails ──────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  reference: string,
  total: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await sendEmail(to, `Order Confirmed — ${reference}`, `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#1a1a1a;margin:0 0 8px;">Order confirmed</h2>
      <p style="color:#555;line-height:1.6;">Hi ${escapeHtml(name)}, thanks for your order at <strong>ValGadget</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#777;">Order Reference</td><td style="font-weight:600;">${escapeHtml(reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#777;">Total Paid</td><td style="font-weight:600;">${escapeHtml(total)}</td></tr>
      </table>
      <a href="${baseUrl}/account/orders"
         style="display:inline-block;margin:8px 0;padding:14px 28px;background:#e8610a;
                color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        View Order
      </a>
    </div>
  `)
}

export async function sendRaffleWinnerEmail(to: string, name: string, raffleTitle: string): Promise<void> {
  await sendEmail(to, `You won the ${escapeHtml(raffleTitle)} raffle!`, `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#1a1a1a;margin:0 0 8px;">Congratulations ${escapeHtml(name)}!</h2>
      <p style="color:#555;line-height:1.6;">You are the lucky winner of the 
         <strong>${escapeHtml(raffleTitle)}</strong> raffle on ValGadget.</p>
      <p style="color:#555;line-height:1.6;">Our team will contact you shortly with prize delivery details.</p>
    </div>
  `)
}

export async function sendGuestOrderConfirmationEmail(
  to: string,
  reference: string,
  total: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await sendEmail(to, `Order Confirmed — ${reference}`, `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#1a1a1a;margin:0 0 8px;">Order confirmed</h2>
      <p style="color:#555;line-height:1.6;">Thank you for your order at <strong>ValGadget</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#777;">Order Reference</td><td style="font-weight:600;">${escapeHtml(reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#777;">Total</td><td style="font-weight:600;">${escapeHtml(total)}</td></tr>
      </table>
      <p style="color:#777;font-size:14px;">Track your order at:</p>
      <a href="${baseUrl}/orders/guest/${reference}"
         style="display:inline-block;margin:8px 0;padding:14px 28px;background:#e8610a;
                color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
         Track Order
       </a>
     </div>
   `)
}

// ─── Safe fire-and-forget wrappers ─────────────────────────────────────────

export function safeSendVerificationEmail(to: string, name: string, token: string, context = 'verification'): void {
  sendVerificationEmail(to, name, token).catch(err =>
    console.error(`[${context}] Failed to send verification email to ${to}:`, err instanceof Error ? err.message : err)
  )
}

export function safeSendPasswordResetEmail(to: string, name: string, token: string, context = 'password-reset'): void {
  sendPasswordResetEmail(to, name, token).catch(err =>
    console.error(`[${context}] Failed to send password reset email to ${to}:`, err instanceof Error ? err.message : err)
  )
}

export function safeSendRaffleWinnerEmail(to: string, name: string, raffleTitle: string, context = 'raffle-winner'): void {
  sendRaffleWinnerEmail(to, name, raffleTitle).catch(err =>
    console.error(`[${context}] Failed to send raffle winner email to ${to}:`, err instanceof Error ? err.message : err)
  )
}
