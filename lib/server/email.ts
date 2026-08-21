/** Resend delivery wrappers. Templates are shared with the admin preview page. */
import { Resend } from 'resend'
import { orderConfirmationTemplate, passwordResetTemplate, paymentConfirmedTemplate, raffleWinnerTemplate, refundTemplate, statusUpdateTemplate, verificationTemplate, type EmailOrderItem } from '@/lib/email-templates'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Val Gadgets <noreply@valgadget.com>'
let resend: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set.')
  resend ??= new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEmail(to: string, subject: string, html: string) { await getResend().emails.send({ from: FROM, to, subject, html }) }
export async function safeSendEmail(to: string, subject: string, html: string, context = 'email') {
  try { await sendEmail(to, subject, html); return true }
  catch (error) { console.error(`[${context}] Failed to send email to ${to}:`, error instanceof Error ? error.message : error); return false }
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const template = verificationTemplate(name, `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(token)}`)
  await sendEmail(to, template.subject, template.html)
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const template = passwordResetTemplate(name, `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`)
  await sendEmail(to, template.subject, template.html)
}

export async function sendOrderConfirmationEmail(to: string, name: string, reference: string, total: string, items?: EmailOrderItem[], paymentMethod?: string | null) {
  const template = orderConfirmationTemplate({ name, reference, total, items, paymentMethod, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/account/orders` })
  await sendEmail(to, template.subject, template.html)
}

export async function sendGuestOrderConfirmationEmail(to: string, reference: string, total: string, orderId?: string, accessToken?: string, items?: EmailOrderItem[], paymentMethod?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const actionUrl = orderId && accessToken ? `${baseUrl}/orders/guest/${orderId}?token=${encodeURIComponent(accessToken)}` : `${baseUrl}/contact`
  const template = orderConfirmationTemplate({ name: 'there', reference, total, items, paymentMethod, actionUrl, actionLabel: 'Track order' })
  await sendEmail(to, template.subject, template.html)
}

export async function sendOrderStatusUpdateEmail(to: string, name: string, reference: string, status: string, trackingNumber?: string | null, trackingUrl?: string | null) {
  const template = statusUpdateTemplate(name, reference, status, trackingNumber, trackingUrl)
  await sendEmail(to, template.subject, template.html)
}

export async function sendPaymentConfirmedEmail(to: string, name: string, reference: string, total: string, actionUrl: string) {
  const template = paymentConfirmedTemplate(name, reference, total, actionUrl)
  await sendEmail(to, template.subject, template.html)
}

export async function sendRefundEmail(to: string, name: string, reference: string, amount: string, reason: string, providerStatus: string) {
  const template = refundTemplate(name, reference, amount, reason, providerStatus)
  await sendEmail(to, template.subject, template.html)
}

export async function sendRaffleWinnerEmail(to: string, name: string, raffleTitle: string) {
  const template = raffleWinnerTemplate(name, raffleTitle)
  await sendEmail(to, template.subject, template.html)
}

export function safeSendVerificationEmail(to: string, name: string, token: string, context = 'verification') { void sendVerificationEmail(to, name, token).catch(error => console.error(`[${context}]`, error)) }
export function safeSendPasswordResetEmail(to: string, name: string, token: string, context = 'password-reset') { void sendPasswordResetEmail(to, name, token).catch(error => console.error(`[${context}]`, error)) }
export function safeSendRaffleWinnerEmail(to: string, name: string, raffleTitle: string, context = 'raffle-winner') { void sendRaffleWinnerEmail(to, name, raffleTitle).catch(error => console.error(`[${context}]`, error)) }
