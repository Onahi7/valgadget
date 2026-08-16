'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Newsletter signup. POSTs to /api/newsletter, which records the address and
 * optionally notifies the admin. Designed as a dark brand band.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    if (status === 'loading' || status === 'done') return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Something went wrong. Please try again.')
      }
      setStatus('done')
      toast.success('You\'re on the list!', { description: 'Watch your inbox for deals and raffle drops.' })
    } catch (err) {
      setStatus('idle')
      toast.error(err instanceof Error ? err.message : 'Subscription failed. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-secondary-foreground/25 px-5 py-3 text-sm font-medium text-secondary-foreground">
        <Check className="h-4 w-4 text-primary" />
        Subscribed — talk soon!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className="h-12 flex-1 rounded-full border-secondary-foreground/25 bg-secondary-foreground/5 px-5 text-base text-secondary-foreground placeholder:text-secondary-foreground/40 focus-visible:ring-primary"
      />
      <Button
        type="submit"
        disabled={status === 'loading'}
        className="h-12 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </Button>
    </form>
  )
}