'use client'

import { useState } from 'react'
import { EMAIL_PREVIEWS } from '@/lib/email-templates'

const LABELS: Record<keyof typeof EMAIL_PREVIEWS, string> = {
  order: 'Order confirmation', payment: 'Payment confirmed', shipping: 'Shipping update',
  refund: 'Refund update', verification: 'Email verification', reset: 'Password reset',
}

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState<keyof typeof EMAIL_PREVIEWS>('order')
  const template = EMAIL_PREVIEWS[selected]()

  return (
    <div className="max-w-6xl space-y-6 animate-page-reveal">
      <div><h1 className="text-2xl font-bold tracking-tight">Email Templates</h1><p className="mt-1 text-sm text-muted-foreground">Preview the exact transactional layout customers receive. Sample data is used and no email is sent.</p></div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Email templates">
          {(Object.keys(EMAIL_PREVIEWS) as Array<keyof typeof EMAIL_PREVIEWS>).map(key => <button key={key} onClick={() => setSelected(key)} className={`shrink-0 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${selected === key ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-accent'}`}>{LABELS[key]}</button>)}
        </nav>
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p><p className="mt-1 font-semibold">{template.subject}</p></div>
          <iframe title={`${LABELS[selected]} preview`} srcDoc={template.html} sandbox="" className="h-[720px] w-full bg-white" />
        </section>
      </div>
    </div>
  )
}
