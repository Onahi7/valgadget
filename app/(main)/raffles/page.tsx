'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Ticket, Trophy, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/status-badge'
import { raffleService, type Raffle } from '@/lib/services/raffle.service'
import type { RaffleStatus } from '@/lib/services/raffle.service'

function countdown(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Draw completed'
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${d}d ${h}h ${m}m`
}

export default function RafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    raffleService.getAll()
      .then(r => {
        setRaffles(Array.isArray(r) ? (r as any[]) : [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Win big</p>
        <h1 className="text-4xl font-bold mb-3">Live Raffles</h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Enter for a chance to win premium tech gear at a fraction of the price. 
          Every ticket is a fair shot.
        </p>
      </div>

      {/* Raffle cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {raffles.map(raffle => {
          const pct = Math.round((raffle.soldTickets / raffle.maxTickets) * 100)
          const isSoldOut = raffle.soldTickets >= raffle.maxTickets

          return (
            <article
              key={raffle.id}
              className="animate-fade-up group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-video overflow-hidden bg-surface">
                <Image
                  src={raffle.image}
                  alt={raffle.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <StatusBadge status={raffle.status as RaffleStatus} />
                  {isSoldOut && <Badge variant="destructive" className="text-[10px] font-mono">SOLD OUT</Badge>}
                </div>
              </div>

              <div className="p-5 flex flex-col gap-3">
                <h2 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                  {raffle.title}
                </h2>

                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{raffle.prize}</span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{raffle.description}</p>

                <div className="flex items-center gap-2 text-sm">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono font-bold text-foreground">{countdown(raffle.drawDate)}</span>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3 h-3" />
                      {raffle.soldTickets.toLocaleString()} / {raffle.maxTickets.toLocaleString()} tickets
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Per ticket</p>
                    <p className="font-bold text-lg">₦{raffle.ticketPrice.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSoldOut || raffle.status === 'upcoming'}
                    asChild={!isSoldOut && raffle.status !== 'upcoming'}
                  >
                    {!isSoldOut && raffle.status !== 'upcoming' ? (
                      <Link href={`/raffles/${raffle.id}`}>
                        Enter Raffle <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    ) : (
                      <span>{raffle.status === 'upcoming' ? 'Coming Soon' : 'Sold Out'}</span>
                    )}
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      )}

      {/* How it works */}
      <div className="mt-20 bg-surface rounded-2xl p-8 md:p-12">
        <h2 className="text-2xl font-bold text-center mb-10">How Raffles Work</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Buy tickets', desc: 'Each ticket gives you an equal chance to win. The more tickets, the better your odds.' },
            { step: '02', title: 'Wait for the draw', desc: 'The countdown ends, and a winner is selected randomly from all ticket holders.' },
            { step: '03', title: 'Claim your prize', desc: 'If you win, we contact you directly to arrange delivery of your prize.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-3 text-center">
              <span className="text-4xl font-mono font-bold text-primary/30">{step}</span>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
