import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface HomeRaffle {
  id: string
  title: string
  image: string | null
  prize: string
  ticketPrice: number
  maxTickets: number
  soldTickets: number
  status: string
  drawDate: string
}

interface RaffleStripProps {
  raffles: HomeRaffle[]
}

export function RaffleStrip({ raffles }: RaffleStripProps) {
  if (raffles.length === 0) return null

  const featured = raffles[0]

  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate grid min-h-72 overflow-hidden rounded-2xl bg-secondary text-secondary-foreground lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
            <h2 className="text-3xl font-bold sm:text-4xl">Live gadget raffles</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65 sm:text-base">
              Enter active draws for a chance to win quality tech. Ticket prices and availability are always shown upfront.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button className="h-11 rounded-md bg-primary px-5 font-semibold text-white hover:bg-primary/90" asChild>
                <Link href="/raffles">
                  See live raffles <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="inline-flex items-center gap-2 text-sm text-white/60">
                <Ticket className="h-4 w-4 text-primary" />
                {raffles.length} active {raffles.length === 1 ? 'draw' : 'draws'}
              </span>
            </div>
          </div>

          <Link href={`/raffles/${featured.id}`} className="group relative min-h-64 overflow-hidden bg-black/20">
            {featured.image ? (
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,86,0,.2),transparent_65%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-sm font-semibold text-primary">Featured draw</p>
              <h3 className="mt-1 text-xl font-bold">{featured.title}</h3>
              <p className="mt-1 text-sm text-white/70">
                {featured.prize} · ₦{featured.ticketPrice.toLocaleString()} per ticket
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
