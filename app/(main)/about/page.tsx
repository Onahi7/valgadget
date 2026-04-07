import Link from 'next/link'
import { ArrowRight, Zap, Shield, Truck, RotateCcw, Users, Trophy, Globe, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STATS = [
  { value: '12K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products Listed' },
  { value: '50+', label: 'Active Affiliates' },
  { value: '$2M+', label: 'Revenue Generated' },
]

const VALUES = [
  { icon: Zap, title: 'Bold Selection', desc: 'We only carry gadgets that genuinely impress — no filler, no fluff.' },
  { icon: Shield, title: 'Trusted Quality', desc: 'Every product is vetted before it ever appears on our shelves.' },
  { icon: Truck, title: 'Swift Delivery', desc: 'Order before noon and it ships same day, every weekday.' },
  { icon: RotateCcw, title: 'Hassle-Free Returns', desc: 'Changed your mind? Return anything within 30 days, no questions asked.' },
  { icon: Users, title: 'Community First', desc: 'Our affiliate and raffle programmes put money back in your hands.' },
  { icon: Headphones, title: 'Real Support', desc: 'Humans on the other end of every chat, email, and call.' },
]

const TEAM = [
  { name: 'Alex Chen', role: 'Founder & CEO', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Priya Nair', role: 'Head of Product', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Marcus O.', role: 'Lead Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
  { name: 'Jade Kim', role: 'Head of Marketing', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
]

export default function AboutPage() {
  return (
    <div className="animate-page-reveal">
      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 font-mono text-xs uppercase tracking-widest">
            Our Story
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight text-balance mb-6">
            Built by gear heads,<br />
            <span className="text-primary">for gear heads.</span>
          </h1>
          <p className="text-secondary-foreground/70 text-lg max-w-2xl mx-auto leading-relaxed">
            ValGadget started in 2022 as a side project between two friends who were tired of soulless tech stores.
            Today we ship to 40+ countries and run some of the most exciting gadget raffles on the internet.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl md:text-4xl font-bold font-mono text-primary">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            We believe everyone deserves access to great technology. Our mission is to make premium gadgets accessible, 
            exciting, and rewarding — through transparent pricing, genuine curation, and a community that shares the passion.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">What drives us</p>
            <h2 className="text-3xl font-bold">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="animate-fade-up bg-card border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">The humans</p>
            <h2 className="text-3xl font-bold">Meet the Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {TEAM.map(({ name, role, avatar }) => (
              <div key={name} className="animate-fade-up text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border mx-auto mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Raffle CTA */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Trophy className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to play?</h2>
          <p className="text-secondary-foreground/70 mb-8">
            Enter one of our live raffles and win premium gear at a fraction of the price.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" asChild>
              <Link href="/raffles">View Live Raffles <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 bg-transparent" asChild>
              <Link href="/shop">Browse Shop</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
