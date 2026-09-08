'use client'

import Link from 'next/link'
import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react'

const promises = [
  { label: 'Delivery across Nigeria', Icon: Truck },
  { label: 'Secure checkout', Icon: ShieldCheck },
  { label: 'Quality checked products', Icon: BadgeCheck },
  { label: 'Clear return policy', Icon: RotateCcw },
]

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-[#FAFAF7] text-foreground">
      <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between gap-4 overflow-hidden px-4 text-[11px] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-5 overflow-hidden lg:gap-7">
          {promises.map(({ label, Icon }, index) => (
            <span key={label} className={index > 0 ? 'hidden items-center gap-1.5 whitespace-nowrap sm:flex' : 'flex items-center gap-1.5 whitespace-nowrap'}>
              <Icon className="h-3.5 w-3.5 text-primary" /> {label}
            </span>
          ))}
        </div>
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <Link href="/account/orders" className="hover:text-primary">Track order</Link>
          <Link href="/contact" className="hover:text-primary">Help &amp; support</Link>
          <Link href="/affiliate" className="hover:text-primary">Sell with us</Link>
        </div>
      </div>
    </div>
  )
}
