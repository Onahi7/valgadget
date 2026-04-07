'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Zap, Shield, Truck, RotateCcw, Trophy, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/ecommerce/product-card'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { raffleService, type Raffle } from '@/lib/services/raffle.service'
import { cn } from '@/lib/utils'

const TRUST_BADGES = [
  { icon: Truck, label: 'Free shipping', desc: 'On orders over $99' },
  { icon: Shield, label: 'Secure payments', desc: 'SSL encrypted checkout' },
  { icon: RotateCcw, label: '30-day returns', desc: 'Hassle-free policy' },
  { icon: Zap, label: 'Fast dispatch', desc: 'Ships within 24 hours' },
]

function CountdownTimer({ drawDate }: { drawDate: string }) {
  const diff = new Date(drawDate).getTime() - Date.now()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <Timer className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-muted-foreground">Draws in</span>
      <span className="font-bold text-foreground">{days}d {hours}h {mins}m</span>
    </div>
  )
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals]           = useState<Product[]>([])
  const [categories, setCategories]             = useState<Category[]>([])
  const [activeRaffles, setActiveRaffles]       = useState<Raffle[]>([])
  const [heroProducts, setHeroProducts]         = useState<Product[]>([])

  useEffect(() => {
    productService.getFeatured().then(r => { if (Array.isArray(r)) setFeaturedProducts((r as any[]).slice(0, 4)) })
    productService.getNewArrivals().then(r => { if (Array.isArray(r)) setNewArrivals((r as any[]).slice(0, 4)) })
    productService.getAll({ limit: 4 }).then(r => { if ((r as any)?.data) setHeroProducts((r as any).data.slice(0, 4)) })
    categoryService.getFlat().then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
    raffleService.getAll().then(r => {
      const list: Raffle[] = Array.isArray(r) ? (r as any[]) : []
      setActiveRaffles(list.filter(x => x.status === 'active').slice(0, 2))
    })
  }, [])

  return (
    <div className="animate-page-reveal">
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <Badge className="w-fit font-mono text-xs uppercase tracking-widest bg-primary/20 text-primary border-primary/30">
                New arrivals dropping now
              </Badge>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tight text-balance">
                Next-Level
                <br />
                <span className="text-primary">Tech Gear</span>
                <br />
                For Bold People
              </h1>
              <p className="text-secondary-foreground/70 text-lg leading-relaxed max-w-md">
                Shop cutting-edge gadgets, enter exclusive raffles, and level up your setup. 
                Premium gear at real prices.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" asChild>
                  <Link href="/shop">
                    Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 bg-transparent"
                  asChild
                >
                  <Link href="/raffles">View Raffles</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2 text-sm text-secondary-foreground/50">
                <span className="font-bold text-secondary-foreground text-2xl">12K+</span>
                <span>Happy customers</span>
                <span className="w-px h-4 bg-secondary-foreground/20" />
                <span className="font-bold text-secondary-foreground text-2xl">500+</span>
                <span>Products</span>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {heroProducts.slice(0, 4).map((product, i) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className={cn(
                    'group relative aspect-square rounded-lg overflow-hidden bg-secondary-foreground/5',
                    i === 0 ? 'row-span-2' : ''
                  )}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-white text-xs font-medium line-clamp-2">{product.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Handpicked</p>
              <h2 className="text-3xl font-bold">Featured Gear</h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/shop?sort=popular">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} className="animate-fade-up" />
            ))}
          </div>
        </div>
      </section>

      {/* Active Raffles Banner */}
      {activeRaffles.length > 0 && (
        <section className="py-16 bg-secondary text-secondary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Win big</p>
                <h2 className="text-3xl font-bold">Live Raffles</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 bg-transparent"
                asChild
              >
                <Link href="/raffles">All raffles <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {activeRaffles.map(raffle => {
                const pct = Math.round((raffle.soldTickets / raffle.maxTickets) * 100)
                return (
                  <Link
                    key={raffle.id}
                    href={`/raffles/${raffle.id}`}
                    className="group flex gap-5 bg-secondary-foreground/5 hover:bg-secondary-foreground/10 rounded-xl p-5 border border-secondary-foreground/10 transition-all hover:border-primary/40"
                  >
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary-foreground/10 shrink-0">
                      <Image src={raffle.image} alt={raffle.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">{raffle.title}</h3>
                        <Badge className="shrink-0 font-mono text-[10px] bg-primary/20 text-primary border-primary/30">LIVE</Badge>
                      </div>
                      <p className="text-xs text-secondary-foreground/60">Prize value: <strong className="text-secondary-foreground">₦{raffle.prizeValue.toLocaleString()}</strong></p>
                      <CountdownTimer drawDate={raffle.drawDate} />
                      <div className="mt-auto">
                        <div className="flex justify-between text-[11px] text-secondary-foreground/50 mb-1">
                          <span>{raffle.soldTickets} / {raffle.maxTickets} tickets sold</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary-foreground/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Browse by</p>
            <h2 className="text-3xl font-bold">Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="animate-fade-up group flex flex-col items-center gap-2 p-5 rounded-xl border border-border hover:border-primary/40 hover:bg-accent transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-semibold">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.productCount} items</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals strip */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Just landed</p>
              <h2 className="text-3xl font-bold">New Arrivals</h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/shop?sort=newest">See all <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} className="animate-fade-up" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative text-center px-8 py-16 flex flex-col items-center gap-5">
              <Badge className="bg-white/20 text-white border-white/30 font-mono text-xs uppercase tracking-widest">
                Affiliate Program
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
                Earn by sharing what you love
              </h2>
              <p className="text-white/80 max-w-lg leading-relaxed">
                Join our affiliate program and earn commission on every sale you generate. 
                Real-time tracking, competitive rates, and fast payouts.
              </p>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                asChild
              >
                <Link href="/affiliate">Join as Affiliate <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
