import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative isolate min-h-[520px] overflow-hidden bg-[#0d0e10] text-white">
      <Image
        src="/hero-gadgets-dark.png"
        alt="Premium phones, audio gear and accessories available at Val Gadgets"
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[62%_center] sm:object-center"
        priority
      />

      <div className="mx-auto flex min-h-[520px] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-[2.65rem] font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            <span className="block">Tech that works.</span>
            <span className="mt-2 block text-terracotta">Prices that don&apos;t stress.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
            Quality-checked gadgets, fair prices and nationwide delivery — without the guesswork.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="h-12 rounded-md bg-primary px-6 text-base font-semibold text-white hover:bg-primary/90" asChild>
              <Link href="/shop">
                Shop gadgets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/raffles"
              className="inline-flex h-12 items-center gap-2 px-1 text-sm font-semibold text-white underline decoration-terracotta decoration-2 underline-offset-8 transition-colors hover:text-terracotta sm:px-4"
            >
              Explore live raffles
              <ArrowRight className="h-4 w-4 text-terracotta" />
            </Link>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/15 pt-5 text-sm text-white/70 sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-terracotta" />
              Paystack-secured checkout
            </span>
            <span className="hidden h-4 w-px bg-white/25 sm:block" />
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-terracotta" />
              Delivery across Nigeria
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
