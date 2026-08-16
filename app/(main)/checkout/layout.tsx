import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LockKeyhole } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely with Paystack.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Val Gadgets home" className="shrink-0">
            <Image src="/logo.png" alt="Val Gadgets" width={142} height={50} className="h-10 w-auto object-contain" priority />
          </Link>
          <p className="hidden items-center gap-2 text-sm font-medium text-slate-600 sm:flex">
            <LockKeyhole className="h-4 w-4 text-slate-900" />
            Secure checkout
          </p>
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
