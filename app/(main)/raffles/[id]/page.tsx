'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy, Timer, Ticket, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { raffleService, type Raffle } from '@/lib/services/raffle.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function useCountdown(drawDate: string) {
  const [diff, setDiff] = useState(() => new Date(drawDate).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setDiff(new Date(drawDate).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [drawDate])
  const total = Math.max(0, diff)
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    expired: total === 0,
  }
}

const STATUS_MAP = {
  active: { label: 'Live', className: 'bg-green-100 text-green-700 border-green-200' },
  upcoming: { label: 'Coming Soon', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  drawing: { label: 'Drawing', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Ended', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
}

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated } = useAuth()
  const [raffle, setRaffle] = useState<Raffle | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    raffleService.getById(id)
      .then(r => { if (r) setRaffle(r as any) })
      .finally(() => setFetchLoading(false))
  }, [id])

  const [ticketCount, setTicketCount] = useState(1)
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)

  const countdown = useCountdown(raffle?.drawDate ?? new Date().toISOString())

  if (fetchLoading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>

  if (!raffle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Raffle not found</h1>
        <p className="text-muted-foreground mb-6">This raffle may have ended or doesn&apos;t exist.</p>
        <Button asChild><Link href="/raffles"><ArrowLeft className="w-4 h-4 mr-2" />All Raffles</Link></Button>
      </div>
    )
  }

  const pct = Math.round((raffle.soldTickets / raffle.maxTickets) * 100)
  const remaining = raffle.maxTickets - raffle.soldTickets
  const statusInfo = STATUS_MAP[raffle.status] ?? STATUS_MAP.active
  const isActive = raffle.status === 'active'
  const totalCost = ticketCount * raffle.ticketPrice

  const handleEnter = async () => {
    if (!isAuthenticated) { toast.error('Please log in to enter raffles'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setEntered(true)
    setLoading(false)
    toast.success(`Entered! You have ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} in this raffle.`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <Link href="/raffles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Raffles
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left: Image */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border">
            <Image src={raffle.image} alt={raffle.title} fill className="object-cover" unoptimized />
            <div className="absolute top-4 left-4">
              <Badge className={cn('border font-medium', statusInfo.className)}>{statusInfo.label}</Badge>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Prize Value', value: `₦${raffle.prizeValue.toLocaleString()}` },
              { label: 'Ticket Price', value: `₦${raffle.ticketPrice.toLocaleString()}` },
              { label: 'Remaining', value: remaining.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-lg font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details + Entry */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Raffle #{raffle.id}</p>
            <h1 className="text-3xl font-bold text-balance mb-3">{raffle.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{raffle.description}</p>
          </div>

          {/* Prize */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Prize</p>
              <p className="font-bold">{raffle.prize}</p>
            </div>
          </div>

          {/* Countdown */}
          {isActive && !countdown.expired && (
            <div className="bg-secondary text-secondary-foreground rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-secondary-foreground/80">Draw closes in</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Mins' },
                  { value: countdown.seconds, label: 'Secs' },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-secondary-foreground/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold font-mono tabular-nums">{String(value).padStart(2, '0')}</p>
                    <p className="text-[11px] text-secondary-foreground/60 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets sold progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {raffle.soldTickets} tickets sold
              </span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">{remaining} of {raffle.maxTickets} tickets remaining</p>
          </div>

          <Separator />

          {/* Entry box */}
          {isActive && !entered && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Select Tickets</p>
                <p className="text-sm text-muted-foreground">₦{raffle.ticketPrice.toLocaleString()} each</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline" size="icon"
                  onClick={() => setTicketCount(v => Math.max(1, v - 1))}
                  disabled={ticketCount <= 1}
                >−</Button>
                <span className="w-12 text-center font-bold text-lg font-mono">{ticketCount}</span>
                <Button
                  variant="outline" size="icon"
                  onClick={() => setTicketCount(v => Math.min(10, v + 1))}
                  disabled={ticketCount >= 10}
                >+</Button>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">₦{totalCost.toLocaleString()}</p>
                </div>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                size="lg"
                onClick={handleEnter}
                disabled={loading || remaining === 0}
              >
                <Ticket className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : remaining === 0 ? 'Sold Out' : `Enter with ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`}
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center">
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link> to enter this raffle
                </p>
              )}
            </div>
          )}

          {entered && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-5 flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">You&apos;re entered!</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You have {ticketCount} ticket{ticketCount > 1 ? 's' : ''} in this raffle. Good luck!
                </p>
              </div>
            </div>
          )}

          {raffle.status === 'completed' && raffle.winner && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <p className="font-bold">Winner Announced</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Congratulations to <strong>{raffle.winner.name}</strong> — ticket #{raffle.winner.ticketNumber}
              </p>
            </div>
          )}

          {raffle.status === 'cancelled' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-xl p-5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">This raffle has been cancelled. Any entries have been refunded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
