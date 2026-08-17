'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Trophy, Shuffle, XCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { raffleService } from '@/lib/services/raffle.service'
import type { Raffle } from '@/lib/services/raffle.service'
import { getToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { RAFFLE_STATUS_COLORS } from '@/lib/constants/admin-status-colors'

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    raffleService.getAll()
      .then(r => {
        setRaffles(Array.isArray(r) ? (r as any[]) : ((r as any)?.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  const triggerDraw = async (id: string, title: string) => {
    const res = await fetch(`/api/admin/raffles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
      body: JSON.stringify({ status: 'completed' }),
    })
    if (res.ok) {
      const data = await res.json()
      setRaffles(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))
      toast.success(`Draw complete for "${title}"!`)
    } else {
      toast.error('Failed to trigger draw')
    }
  }

  const cancelRaffle = async (id: string, title: string) => {
    if (!confirm(`Cancel "${title}"?`)) return
    const res = await fetch(`/api/admin/raffles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (res.ok) {
      setRaffles(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
      toast.info(`"${title}" cancelled`)
    } else {
      toast.error('Failed to cancel raffle')
    }
  }

  const totalRevenue = raffles.reduce((s, r) => s + r.soldTickets * r.ticketPrice, 0)

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raffles</h1>
          <p className="text-sm text-muted-foreground">{raffles.length} raffles · ₦{totalRevenue.toLocaleString()} revenue</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm" asChild>
          <Link href="/admin/raffles/new"><Plus className="w-4 h-4" /> New Raffle</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active',    value: raffles.filter(r => r.status === 'active').length },
          { label: 'Upcoming',  value: raffles.filter(r => r.status === 'upcoming').length },
          { label: 'Completed', value: raffles.filter(r => r.status === 'completed').length },
          { label: 'Revenue',   value: `₦${totalRevenue.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Raffle cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {raffles.map(raffle => {
          const pct = Math.round((raffle.soldTickets / raffle.maxTickets) * 100)
          const revenue = raffle.soldTickets * raffle.ticketPrice
          return (
            <div key={raffle.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="relative h-36 bg-surface">
                <Image src={raffle.image} alt={raffle.title} fill className="object-cover" unoptimized />
                <div className="absolute top-3 left-3">
                  <Badge className={cn('border text-[11px] font-medium capitalize', RAFFLE_STATUS_COLORS[raffle.status])}>
                    {raffle.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm line-clamp-1">{raffle.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-primary" /> {raffle.prize}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="font-bold font-mono">₦{raffle.ticketPrice.toLocaleString()}</p>
                    <p className="text-muted-foreground">Ticket</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="font-bold font-mono">{raffle.soldTickets}/{raffle.maxTickets}</p>
                    <p className="text-muted-foreground">Sold</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="font-bold font-mono">₦{revenue.toLocaleString()}</p>
                    <p className="text-muted-foreground">Revenue</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Tickets sold</span><span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Draw: {new Date(raffle.drawDate).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  {raffle.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => triggerDraw(raffle.id, raffle.title)}
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Draw Winner
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    asChild
                  >
                    <Link href={`/admin/raffles/${raffle.id}/edit`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </Button>
                  {(raffle.status === 'active' || raffle.status === 'upcoming') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => cancelRaffle(raffle.id, raffle.title)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {raffle.status === 'completed' && raffle.winner && (
                    <div className="flex-1 bg-green-50 dark:bg-green-950 rounded-md px-3 py-1.5 text-xs text-green-700 dark:text-green-300 font-medium">
                      Winner: {raffle.winner.name} (#{raffle.winner.ticketNumber})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
