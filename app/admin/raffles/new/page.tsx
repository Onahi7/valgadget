'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { raffleService } from '@/lib/services/raffle.service'
import { toast } from 'sonner'

export default function NewRafflePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    prize: '',
    prizeValue: '',
    ticketPrice: '',
    maxTickets: '',
    drawDate: '',
    image: '',
  })

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { title, prize, prizeValue, ticketPrice, maxTickets, drawDate } = form
    if (!title || !prize || !prizeValue || !ticketPrice || !maxTickets || !drawDate) {
      toast.error('All fields except Image URL are required')
      return
    }
    setSaving(true)
    const res = await raffleService.create({
      title: title.trim(),
      description: form.description.trim(),
      prize: prize.trim(),
      prizeValue: Number(prizeValue),
      ticketPrice: Number(ticketPrice),
      maxTickets: Number(maxTickets),
      drawDate: new Date(drawDate).toISOString(),
      image: form.image.trim() || undefined,
    })
    setSaving(false)
    if (res) {
      toast.success(`Raffle "${title}" created`)
      router.push('/admin/raffles')
    } else {
      toast.error('Failed to create raffle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/admin/raffles"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Raffle</h1>
          <p className="text-xs text-muted-foreground">Create a new live raffle</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 bg-primary text-primary-foreground">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
          Create Raffle
        </Button>
      </div>

      <div className="space-y-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Raffle Details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="MacBook Pro M4 Raffle" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe the raffle and prize..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Prize</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prize">Prize Name *</Label>
              <Input id="prize" value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="MacBook Pro 16&quot; M4" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prizeValue">Prize Value ($) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input id="prizeValue" type="number" min="0" step="0.01" value={form.prizeValue} onChange={e => set('prizeValue', e.target.value)} className="pl-7" required />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Tickets & Draw</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticketPrice">Ticket Price ($) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input id="ticketPrice" type="number" min="0.01" step="0.01" value={form.ticketPrice} onChange={e => set('ticketPrice', e.target.value)} className="pl-7" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxTickets">Max Tickets *</Label>
              <Input id="maxTickets" type="number" min="1" value={form.maxTickets} onChange={e => set('maxTickets', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawDate">Draw Date *</Label>
              <Input id="drawDate" type="datetime-local" value={form.drawDate} onChange={e => set('drawDate', e.target.value)} required />
            </div>
          </div>
          {form.ticketPrice && form.maxTickets && (
            <p className="text-xs text-muted-foreground">
              Max revenue: <strong className="text-foreground">₦{(Number(form.ticketPrice) * Number(form.maxTickets)).toLocaleString()}</strong>
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
