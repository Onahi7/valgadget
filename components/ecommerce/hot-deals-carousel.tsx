'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ProductCard } from '@/components/ecommerce/product-card'
import type { Product } from '@/lib/services/product.service'

export function HotDealsCarousel({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section className="bg-[#F5F6F5] py-3">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-[#F26A32] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-4 text-white">
            <div className="flex min-w-0 items-baseline gap-4">
              <h2 className="shrink-0 text-xl font-bold sm:text-2xl">Today&apos;s deals</h2>
              <p className="hidden truncate text-xs text-white/85 sm:block">Great value from the latest catalog.</p>
            </div>
            <Link href="/deals" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold hover:underline">See all deals <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <Carousel opts={{ align: 'start', containScroll: 'trimSnaps' }} className="relative">
            <CarouselContent className="-ml-2.5">
              {products.map(product => (
                <CarouselItem key={product.id} className="basis-[72%] pl-2.5 min-[480px]:basis-1/2 sm:basis-1/3 lg:basis-1/5 xl:basis-1/6">
                  <ProductCard product={product} compact className="h-full border-white" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 hidden border-0 bg-white text-foreground shadow-md lg:flex" />
            <CarouselNext className="right-2 hidden border-0 bg-white text-foreground shadow-md lg:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
