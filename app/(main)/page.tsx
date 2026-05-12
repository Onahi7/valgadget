'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Zap, Shield, Truck, RotateCcw, Trophy, Timer,
  Smartphone, Laptop, Headphones, Camera, Battery, Wifi,
  Watch, Gamepad2, Speaker, Tablet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/ecommerce/product-card'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { raffleService, type Raffle } from '@/lib/services/raffle.service'
import { cn } from '@/lib/utils'

const TRUST_BADGES = [
  { icon: Truck,     label: 'Free Shipping',    desc: 'On orders over ₦500k' },
  { icon: Shield,    label: 'Secure Payments',  desc: 'SSL encrypted checkout' },
  { icon: RotateCcw, label: '30-Day Returns',   desc: 'Hassle-free policy' },
  { icon: Zap,       label: 'Fast Dispatch',    desc: 'Ships within 24 hours' },
]

const QUICK_CATEGORIES = [
  { label: 'Phones',      icon: Smartphone,  slug: 'smartphones-tablets',    color: 'bg-blue-50 text-blue-600' },
  { label: 'Laptops',     icon: Laptop,      slug: 'laptops-computers',       color: 'bg-purple-50 text-purple-600' },
  { label: 'Audio',       icon: Headphones,  slug: 'audio-sound',             color: 'bg-pink-50 text-pink-600' },
  { label: 'Cameras',     icon: Camera,      slug: 'camera-recording-gear',   color: 'bg-amber-50 text-amber-600' },
  { label: 'Power Banks', icon: Battery,     slug: 'powerbanks',              color: 'bg-green-50 text-green-600' },
  { label: 'Networking',  icon: Wifi,        slug: 'networking-connectivity', color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Wearables',   icon: Watch,       slug: 'wearables-smartwatches',  color: 'bg-rose-50 text-rose-600' },
  { label: 'Gaming',      icon: Gamepad2,    slug: 'gaming-entertainment',    color: 'bg-violet-50 text-violet-600' },
  { label: 'Speakers',    icon: Speaker,     slug: 'smart-home-speakers',     color: 'bg-orange-50 text-orange-600' },
  { label: 'Tablets',     icon: Tablet,      slug: 'smartphones-tablets',     color: 'bg-teal-50 text-teal-600' },
]

function CountdownTimer({ drawDate }: { drawDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(drawDate).getTime() - Date.now()
      setTime({
        days:  Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
        mins:  Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
        secs:  Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [drawDate])
  return (
    <div className="flex items-center gap-2">
      <Timer className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-xs text-muted-foreground">Draws in</span>
      <div className="flex items-center gap-1 font-mono text-xs font-bold">
        {[
          { v: time.days, u: 'd' },
          { v: time.hours, u: 'h' },
          { v: time.mins, u: 'm' },
          { v: time.secs, u: 's' },
        ].map(({ v, u }) => (
          <span key={u} className="bg-primary/10 text-primary rounded px-1.5 py-0.5">{String(v).padStart(2, '0')}{u}</span>
        ))}
      </div>
    </div>
  )
}


function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Simulate newsletter signup
    await new Promise(r => setTimeout(r, 800))
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-2xl">🎉</span>
        </div>
        <h3 className="font-bold text-lg">You're on the list!</h3>
        <p className="text-secondary-foreground/60 text-sm">We'll send you the best deals and raffle alerts. Stay tuned!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-1 rounded-full px-5 py-3 text-sm bg-secondary-foreground/10 border border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shrink-0 font-semibold"
        >
          {loading ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>
      <p className="text-xs text-secondary-foreground/40">
        By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
      </p>
    </form>
  )
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals]           = useState<Product[]>([])
  const [dealProducts, setDealProducts]         = useState<Product[]>([])
  const [categories, setCategories]             = useState<Category[]>([])
  const [activeRaffles, setActiveRaffles]       = useState<Raffle[]>([])
  const [heroProducts, setHeroProducts]         = useState<Product[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [featured, arrivals, cats, raffles, deals] = await Promise.all([
          productService.getFeatured(),
          productService.getNewArrivals(),
          categoryService.getFlat(),
          raffleService.getAll(),
          productService.getAll({ sort: 'popular', limit: 4 }),
        ])
        setFeaturedProducts(Array.isArray(featured) ? featured.slice(0, 4) : [])
        setNewArrivals(Array.isArray(arrivals) ? arrivals.slice(0, 4) : [])
        setHeroProducts(Array.isArray(featured) ? featured.slice(0, 4) : [])
        if (Array.isArray(cats)) setCategories(cats.slice(0, 12))
        if (Array.isArray(raffles)) setActiveRaffles(raffles.filter(x => x.status === 'active').slice(0, 3))
        const dealData = (deals as any)?.data?.data ?? (deals as any)?.data ?? []
        setDealProducts(Array.isArray(dealData) ? dealData.filter((p: Product) => p.comparePrice).slice(0, 4) : [])
      } catch (err) {
        console.error('[home page load]', err)
      }
    }
    loadData()
  }, [])

  return (
    <div className="animate-page-reveal">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
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
                Premium gear at real Nigerian prices.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-8" asChild>
                  <Link href="/shop">
                    Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 bg-transparent rounded-full px-8"
                  asChild
                >
                  <Link href="/raffles">View Raffles 🎟</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-2 text-sm text-secondary-foreground/50">
                <span>🚚 Nationwide delivery</span>
                <span className="w-px h-4 bg-secondary-foreground/20" />
                <span>🔒 Secure checkout</span>
                <span className="w-px h-4 bg-secondary-foreground/20" />
                <span>↩ 30-day returns</span>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {heroProducts.slice(0, 4).map((product, i) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className={cn(
                    'group relative aspect-square rounded-2xl overflow-hidden bg-secondary-foreground/5',
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-white text-xs font-medium line-clamp-2">{product.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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

      {/* ── Quick category shortcuts ── */}
      <section className="py-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Browse by Category</h2>
            <Link href="/categories" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              All categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-3">
            {QUICK_CATEGORIES.map(({ label, icon: Icon, slug, color }) => (
              <Link
                key={label}
                href={`/shop?category=${slug}`}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-background hover:bg-accent border border-border hover:border-primary/30 transition-all text-center"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Handpicked for you</p>
              <h2 className="text-2xl font-bold">Featured Gear</h2>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
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

      {/* ── Promotional banner ── */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 flex flex-col gap-3">
              <Badge className="w-fit bg-white/20 text-white border-0 text-xs">🔥 Hot Deal</Badge>
              <h3 className="text-xl font-bold leading-tight">Up to 30% off<br/>on Smartphones</h3>
              <Button size="sm" className="w-fit bg-white text-orange-600 hover:bg-white/90 rounded-full font-semibold" asChild>
                <Link href="/shop?category=smartphones-tablets">Shop Phones</Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 text-white p-6 flex flex-col gap-3">
              <Badge className="w-fit bg-white/20 text-white border-0 text-xs">⚡ Flash Sale</Badge>
              <h3 className="text-xl font-bold leading-tight">Best deals on<br/>Audio & Sound</h3>
              <Button size="sm" className="w-fit bg-white text-violet-700 hover:bg-white/90 rounded-full font-semibold" asChild>
                <Link href="/shop?category=audio-sound">Shop Audio</Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6 flex flex-col gap-3">
              <Badge className="w-fit bg-white/20 text-white border-0 text-xs">🎟 Win Big</Badge>
              <h3 className="text-xl font-bold leading-tight">Enter our live<br/>gadget raffles</h3>
              <Button size="sm" className="w-fit bg-white text-emerald-700 hover:bg-white/90 rounded-full font-semibold" asChild>
                <Link href="/raffles">View Raffles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Raffles Banner ── */}
      {activeRaffles.length > 0 && (
        <section className="py-14 bg-secondary text-secondary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Win big</p>
                <h2 className="text-2xl font-bold">Live Raffles</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 bg-transparent rounded-full"
                asChild
              >
                <Link href="/raffles">All raffles <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {activeRaffles.map(raffle => {
                const pct = Math.round((raffle.soldTickets / raffle.maxTickets) * 100)
                return (
                  <Link
                    key={raffle.id}
                    href={`/raffles/${raffle.id}`}
                    className="group flex flex-col bg-secondary-foreground/5 hover:bg-secondary-foreground/10 rounded-2xl overflow-hidden border border-secondary-foreground/10 transition-all hover:border-primary/40"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image src={raffle.image} alt={raffle.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 text-[11px] font-mono">LIVE</Badge>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-sm line-clamp-1">{raffle.title}</h3>
                        <p className="text-white/70 text-xs">Prize: ₦{raffle.prizeValue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2.5">
                      <CountdownTimer drawDate={raffle.drawDate} />
                      <div>
                        <div className="flex justify-between text-[11px] text-secondary-foreground/50 mb-1">
                          <span>{raffle.soldTickets} / {raffle.maxTickets} tickets</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary-foreground/10 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-primary font-semibold">₦{raffle.ticketPrice.toLocaleString()} / ticket →</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── New arrivals strip ── */}
      <section className="py-14 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Just landed</p>
              <h2 className="text-2xl font-bold">New Arrivals</h2>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
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

      {/* ── How it works ── */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Simple process</p>
            <h2 className="text-2xl font-bold">How ValGadget Works</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Browse',    desc: 'Explore 46+ premium gadgets across all categories',           emoji: '🔍' },
              { step: '02', title: 'Add to Cart', desc: 'Pick your items and head to secure checkout',              emoji: '🛒' },
              { step: '03', title: 'Pay Safely', desc: 'Pay via card, bank transfer, or crypto — 100% secure',      emoji: '🔒' },
              { step: '04', title: 'Get Delivered', desc: 'Nationwide delivery to all 37 Nigerian states',          emoji: '🚚' },
            ].map(({ step, title, desc, emoji }) => (
              <div key={step} className="relative text-center p-6 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                  {emoji}
                </div>
                <p className="text-[10px] font-mono text-primary font-bold mb-1">STEP {step}</p>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-secondary text-secondary-foreground overflow-hidden relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary -translate-y-1/3 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-primary translate-y-1/3 -translate-x-1/4" />
            </div>
            <div className="relative grid md:grid-cols-2 gap-8 items-center px-8 py-12">
              <div className="flex flex-col gap-4">
                <Badge className="w-fit bg-primary/20 text-primary border-primary/30 font-mono text-xs uppercase tracking-widest">
                  Newsletter
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                  Get exclusive deals straight to your inbox
                </h2>
                <p className="text-secondary-foreground/60 text-sm leading-relaxed">
                  Be the first to know about flash sales, new arrivals, raffle launches, and special promotions. No spam — just great gear.
                </p>
                <div className="flex items-center gap-4 text-xs text-secondary-foreground/40">
                  <span>✓ Weekly deals digest</span>
                  <span>✓ Raffle alerts</span>
                  <span>✓ Unsubscribe anytime</span>
                </div>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative text-center px-8 py-14 flex flex-col items-center gap-5">
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
                className="bg-white text-primary hover:bg-white/90 font-semibold rounded-full px-8"
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
