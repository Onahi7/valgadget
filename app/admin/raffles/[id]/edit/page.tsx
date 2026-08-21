'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

export default function EditRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
    status: '',
  })

  useEffect(() => {
    fetch(`/api/admin/raffles/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.id || data.data) {
          const r = data.data ?? data
          setForm({
            title: r.title ?? '',
            description: r.description ?? '',
            prize: r.prize ?? '',
            prizeValue: String(r.prizeValue ?? ''),
            ticketPrice: String(r.ticketPrice ?? ''),
            maxTickets: String(r.maxTickets ?? ''),
            drawDate: r.drawDate ? new Date(r.drawDate).toISOString().slice(0, 16) : '',
            image: r.image ?? '',
            status: r.status ?? '',
          })
        }
      })
      .catch(() => toast.error('Failed to load raffle'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/raffles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          prize: form.prize.trim(),
          prizeValue: Number(form.prizeValue),
          ticketPrice: Number(form.ticketPrice),
          maxTickets: Number(form.maxTickets),
          drawDate: new Date(form.drawDate).toISOString(),
          image: form.image.trim(),
          status: form.status,
        }),
      })
      if (res.ok) {
        toast.success('Raffle updated')
        router.push('/admin/raffles')
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Failed to update raffle')
      }
    } catch {
      toast.error('Failed to update raffle')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/admin/raffles"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Edit Raffle</h1>
          <p className="text-xs text-muted-foreground">Update raffle details</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 bg-primary text-primary-foreground">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Raffle Details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" value={form.image} onChange={e => set('image', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Prize</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prize">Prize Name *</Label>
              <Input id="prize" value={form.prize} onChange={e => set('prize', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prizeValue">Prize Value (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                <Input id="prizeValue" type="number" min="0" step="0.01" value={form.prizeValue} onChange={e => set('prizeValue', e.target.value)} className="pl-7" required />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">Tickets & Draw</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticketPrice">Ticket Price (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
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
        </div>
      </div>
    </form>
  )
}
