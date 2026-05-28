import { NextRequest } from 'next/server'
import { apiOk, apiError, apiRateLimited } from '@/lib/server/auth-helpers'
import { rateLimit, getRateLimitKey } from '@/lib/server/rate-limiter'
import { sendEmail } from '@/lib/server/email'

export async function POST(req: NextRequest) {
  // Rate limit: 3 submissions per 10 minutes per IP
  const rl = rateLimit(`contact:${getRateLimitKey(req)}`, { windowSeconds: 600, max: 3 })
  if (!rl.success) return apiRateLimited(rl.resetAt)

  try {
    const { name, email, subject, message } = await req.json()

    if (!name?.trim()) return apiError('Name is required.')
    if (!email?.trim()) return apiError('Email is required.')
    if (!message?.trim()) return apiError('Message is required.')
    if (name.length > 200) return apiError('Name is too long.')
    if (email.length > 255) return apiError('Email is too long.')
    if (subject && subject.length > 200) return apiError('Subject is too long.')
    if (message.length > 5000) return apiError('Message is too long.')

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'support@valgadgets.com'
    await sendEmail(adminEmail, `Contact Form: ${subject || 'No Subject'}`, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#777;">Name</td><td style="font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#777;">Email</td><td style="font-weight:600;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#777;">Subject</td><td style="font-weight:600;">${subject || 'No Subject'}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#555;line-height:1.6;white-space:pre-wrap;">${message}</p>
        </div>
      </div>
    `)

    // Send auto-reply to user
    await sendEmail(email, 'We received your message - ValGadget', `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">Thanks for reaching out!</h2>
        <p style="color:#555;line-height:1.6;">Hi ${name},</p>
        <p style="color:#555;line-height:1.6;">We've received your message and our team will get back to you within 24 hours.</p>
        <p style="color:#555;line-height:1.6;">For urgent inquiries, WhatsApp us at +234 703 857 2046.</p>
        <p style="color:#999;font-size:13px;margin-top:24px;">— The ValGadget Team</p>
      </div>
    `)

    return apiOk({ message: 'Message sent successfully.' })
  } catch (err) {
    console.error('[contact form]', err)
    return apiError('Failed to send message. Please try again.', 500)
  }
}
