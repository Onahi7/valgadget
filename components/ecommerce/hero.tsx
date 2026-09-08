import Image from 'next/image'
import Link from 'next/link'

const HERO_ASSET = '/campaigns/power-up-storefront-hero.png'

const desktopHotspots = [
  { label: 'Shop now', href: '/shop', className: 'left-[5.2%] top-[49%] h-[8%] w-[8.5%]' },
  { label: 'Explore deals', href: '/deals', className: 'left-[14.3%] top-[49%] h-[8%] w-[8.8%]' },
  { label: 'Shop top sellers', href: '/shop?sort=popular', className: 'left-[61.7%] top-[4%] h-[34%] w-[16.6%]' },
  { label: 'Shop smart-home products', href: '/shop?search=smart%20home', className: 'left-[79%] top-[4%] h-[34%] w-[17.2%]' },
  { label: 'Shop speakers and audio', href: '/categories/speakers', className: 'left-[61.7%] top-[40%] h-[34%] w-[16.6%]' },
  { label: 'Shop rechargeable fans', href: '/categories/rechargeable-fans', className: 'left-[79%] top-[40%] h-[34%] w-[17.2%]' },
]

export function Hero() {
  return (
    <section className="bg-[#F5F6F5] px-3 pb-3 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <div className="relative h-[258px] overflow-hidden sm:h-auto">
          <Image
            src={HERO_ASSET}
            alt="Power up your world — laptops, phones, watches, headphones, speakers, smart-home devices and rechargeable fans"
            width={922}
            height={288}
            priority
            unoptimized
            className="h-full w-auto max-w-none object-cover object-left sm:h-auto sm:w-full"
          />

          <Link
            href="/shop"
            aria-label="Shop now"
            className="absolute left-[46px] top-[126px] h-[22px] w-[78px] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
          />

          {desktopHotspots.map(hotspot => (
            <Link
              key={hotspot.label}
              href={hotspot.href}
              aria-label={hotspot.label}
              className={`absolute hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:block ${hotspot.className}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
