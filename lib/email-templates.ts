export type EmailTemplate = { subject: string; html: string }
export type EmailOrderItem = { name: string; qty: number; price: number }
export type OrderEmailDetails = { name: string; reference: string; total: string; actionUrl: string; actionLabel?: string; items?: EmailOrderItem[]; paymentMethod?: string | null }

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function button(label: string, url: string) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:#e8610a;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:8px;">${escapeHtml(label)}</a>`
}

function layout(preheader: string, title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#171717;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;"><tr><td style="background:#111827;padding:22px 28px;color:#fff;"><div style="font-size:21px;font-weight:800;letter-spacing:-.3px;">VAL <span style="color:#fb923c;">GADGETS</span></div><div style="font-size:11px;color:#d1d5db;margin-top:4px;letter-spacing:1.4px;text-transform:uppercase;">Your trusted gadget plug</div></td></tr><tr><td style="padding:32px 28px;"><h1 style="font-size:25px;line-height:1.2;margin:0 0 18px;color:#111827;">${escapeHtml(title)}</h1>${body}</td></tr><tr><td style="padding:20px 28px;border-top:1px solid #e7e5e4;color:#78716c;font-size:12px;line-height:1.6;">Need help? Reply to this email or contact Val Gadgets support.<br>&copy; ${new Date().getFullYear()} Val Gadgets. Nationwide delivery across Nigeria.</td></tr></table></td></tr></table></body></html>`
}

const paragraph = (value: string) => `<p style="margin:0 0 18px;color:#57534e;font-size:15px;line-height:1.7;">${value}</p>`

export function verificationTemplate(name: string, url: string): EmailTemplate {
  return { subject: 'Verify your Val Gadgets email', html: layout('Verify your email to finish setting up your account.', 'Verify your email', paragraph(`Hi ${escapeHtml(name)}, thanks for joining <strong>Val Gadgets</strong>. Confirm your email address to finish setting up your account.`) + `<div style="margin:24px 0;">${button('Verify email', url)}</div>` + paragraph('This link expires in 24 hours. If you did not create this account, you can safely ignore this email.')) }
}

export function passwordResetTemplate(name: string, url: string): EmailTemplate {
  return { subject: 'Reset your Val Gadgets password', html: layout('Use this secure link to reset your password.', 'Reset your password', paragraph(`Hi ${escapeHtml(name)}, we received a request to reset your Val Gadgets password.`) + `<div style="margin:24px 0;">${button('Reset password', url)}</div>` + paragraph('This link expires in 1 hour. If you did not request a reset, no action is needed.')) }
}

export function orderConfirmationTemplate(details: OrderEmailDetails): EmailTemplate {
  const rows = (details.items ?? []).map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#444;">${escapeHtml(item.name)} <span style="color:#888;">× ${item.qty}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">₦${(item.price * item.qty).toLocaleString()}</td></tr>`).join('')
  const method = details.paymentMethod ? `<tr><td style="padding:8px 0;color:#78716c;">Payment</td><td align="right" style="font-weight:600;text-transform:capitalize;">${escapeHtml(details.paymentMethod.replaceAll('_', ' '))}</td></tr>` : ''
  return { subject: `Order confirmed — ${details.reference}`, html: layout(`We received order ${details.reference}.`, 'Your order is confirmed', paragraph(`Hi ${escapeHtml(details.name)}, thank you for shopping with Val Gadgets. We have received your order and will keep you updated as it moves.`) + `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;font-size:14px;">${rows}<tr><td style="padding:12px 0;color:#78716c;">Order reference</td><td align="right" style="font-weight:700;">${escapeHtml(details.reference)}</td></tr>${method}<tr><td style="padding:8px 0;color:#78716c;">Total</td><td align="right" style="font-size:17px;font-weight:800;">${escapeHtml(details.total)}</td></tr></table><div style="margin:24px 0 4px;">${button(details.actionLabel ?? 'View order', details.actionUrl)}</div>`) }
}

export function statusUpdateTemplate(name: string, reference: string, status: string, trackingNumber?: string | null, trackingUrl?: string | null): EmailTemplate {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const tracking = trackingNumber ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:15px;margin:20px 0;"><div style="font-size:12px;color:#9a3412;text-transform:uppercase;letter-spacing:.7px;">Tracking number</div><div style="font-family:monospace;font-weight:800;font-size:16px;margin-top:5px;">${escapeHtml(trackingNumber)}</div></div>` : ''
  return { subject: `Order ${label} — ${reference}`, html: layout(`Order ${reference} is now ${status}.`, `Your order is ${label.toLowerCase()}`, paragraph(`Hi ${escapeHtml(name)}, order <strong>${escapeHtml(reference)}</strong> has been updated to <strong>${escapeHtml(label)}</strong>.`) + tracking + (trackingUrl ? `<div style="margin:22px 0 4px;">${button('Track shipment', trackingUrl)}</div>` : '')) }
}

export function paymentConfirmedTemplate(name: string, reference: string, total: string, actionUrl: string): EmailTemplate {
  return { subject: `Payment confirmed — ${reference}`, html: layout(`Payment for order ${reference} has been confirmed.`, 'Payment confirmed', paragraph(`Hi ${escapeHtml(name)}, we have confirmed your payment of <strong>${escapeHtml(total)}</strong> for order <strong>${escapeHtml(reference)}</strong>. Your order can now move to fulfilment.`) + `<div style="margin:24px 0 4px;">${button('View order', actionUrl)}</div>`) }
}

export function refundTemplate(name: string, reference: string, amount: string, reason: string, providerStatus: string): EmailTemplate {
  const pending = !['processed', 'completed', 'success'].includes(providerStatus.toLowerCase())
  return { subject: `Refund ${pending ? 'started' : 'confirmed'} — ${reference}`, html: layout(`Refund update for order ${reference}.`, pending ? 'Your refund has been started' : 'Your refund is confirmed', paragraph(`Hi ${escapeHtml(name)}, a refund of <strong>${escapeHtml(amount)}</strong> has been ${pending ? 'submitted' : 'confirmed'} for order <strong>${escapeHtml(reference)}</strong>.`) + `<div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:9px;padding:15px;margin:20px 0;font-size:14px;"><strong>Reason</strong><br><span style="color:#57534e;line-height:1.6;">${escapeHtml(reason)}</span></div>` + paragraph(pending ? 'Your bank or card provider may take several business days to return the funds.' : 'The refund has been recorded as completed.')) }
}

export function raffleWinnerTemplate(name: string, raffleTitle: string): EmailTemplate {
  return { subject: `You won the ${raffleTitle} raffle!`, html: layout('Congratulations—you won a Val Gadgets raffle!', `Congratulations, ${name}!`, paragraph(`You are the winner of the <strong>${escapeHtml(raffleTitle)}</strong> raffle. Our team will contact you shortly with prize delivery details.`)) }
}

export const EMAIL_PREVIEWS = {
  order: () => orderConfirmationTemplate({ name: 'Ada', reference: 'VG-SAMPLE-2408', total: '₦485,000', paymentMethod: 'paystack', actionUrl: '#', items: [{ name: 'iPhone 15 Pro 256GB', qty: 1, price: 450000 }, { name: '20W USB-C Charger', qty: 1, price: 35000 }] }),
  payment: () => paymentConfirmedTemplate('Ada', 'VG-SAMPLE-2408', '₦485,000', '#'),
  shipping: () => statusUpdateTemplate('Ada', 'VG-SAMPLE-2408', 'shipped', 'DHL-NG-1028842', '#'),
  refund: () => refundTemplate('Ada', 'VG-SAMPLE-2408', '₦485,000', 'Item was returned and inspected.', 'pending'),
  verification: () => verificationTemplate('Ada', '#'),
  reset: () => passwordResetTemplate('Ada', '#'),
} as const
