import { Truck, ShieldCheck, Wallet, BadgePercent } from 'lucide-react'

const ITEMS = [
  {
    Icon: Truck,
    title: 'Nationwide Delivery',
    desc: 'All 36 states + Abuja, from \u20a61,500',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure Payment',
    desc: 'Cards, transfer & USSD via Paystack',
  },
  {
    Icon: Wallet,
    title: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
  },
  {
    Icon: BadgePercent,
    title: 'Genuine Stock',
    desc: 'Quality-checked before dispatch',
  },
]

/**
 * Trust/value strip that sits directly under the hero.
 * Charcoal-free, uses a muted band so the hero stays the focal point.
 */
export function TrustBadges() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          {ITEMS.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}