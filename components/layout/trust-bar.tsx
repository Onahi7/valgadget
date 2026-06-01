import { Award, HeadphonesIcon, ShieldCheck, Truck } from 'lucide-react'

interface TrustBarProps {
  className?: string
}

/**
 * Tech Direct-style "rest beat": a text-only, low-density section that
 * breaks up the rhythm between dense product rows. Uses an icon-row + brand
 * names to signal trust without heavy imagery.
 */
export function TrustBar({ className = '' }: TrustBarProps) {
  const items = [
    { icon: Truck, title: 'Nationwide Delivery', text: 'Dispatch to all 36 states' },
    { icon: ShieldCheck, title: 'Secure Checkout', text: 'Protected payment flow' },
    { icon: Award, title: 'Quality Guaranteed', text: 'Verified authentic products' },
    { icon: HeadphonesIcon, title: 'Responsive Support', text: 'Help choosing the right product' },
  ]

  return (
    <section className={`border-y border-border bg-muted/30 py-8 ${className}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
