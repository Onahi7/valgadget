import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  ChevronRight,
  HandCoins,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Tag,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type PromoCardProps = {
  title: string
  description: string
  href: string
  image: string
  imageAlt: string
  price?: string
  tone: 'forest' | 'mint' | 'white' | 'orange'
}

const toneStyles = {
  forest: 'border-[#183D2A] bg-[#183D2A] text-white',
  mint: 'border-[#DCE4DE] bg-[#EDF5EF] text-[#171B18]',
  white: 'border-[#DCE4DE] bg-white text-[#171B18]',
  orange: 'border-[#F26A32] bg-[#F26A32] text-white',
}

const benefits: Array<{ Icon: LucideIcon; title: string; detail: string }> = [
  { Icon: BadgeCheck, title: 'Best Prices', detail: 'Verified' },
  { Icon: Package, title: 'Bulk Price', detail: 'Drops' },
  { Icon: Bike, title: 'Same Day', detail: 'Delivery' },
  { Icon: ShoppingBasket, title: 'Buy More', detail: 'Save More' },
  { Icon: Tag, title: 'Clearance', detail: 'Deals' },
  { Icon: HandCoins, title: 'Pay on Delivery', detail: 'Available' },
]

function PromoCard({ title, description, href, image, imageAlt, price, tone }: PromoCardProps) {
  return (
    <article className={`group relative min-h-[174px] overflow-hidden rounded-xl border lg:min-h-0 ${toneStyles[tone]}`}>
      <div className="relative z-10 flex h-full max-w-[62%] flex-col items-start p-4 sm:p-5">
        <h2 className="text-[17px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[19px]">{title}</h2>
        <p className={`mt-2 text-[11px] leading-snug ${tone === 'forest' || tone === 'orange' ? 'text-white/80' : 'text-[#536159]'}`}>
          {description}
        </p>
        {price ? (
          <p className={`mt-2 text-xs font-extrabold ${tone === 'orange' ? 'text-white' : 'text-[#F26A32]'}`}>{price}</p>
        ) : null}
        <Link
          href={href}
          className={`mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-extrabold underline-offset-4 hover:underline ${tone === 'forest' || tone === 'orange' ? 'text-white' : 'text-[#183D2A]'}`}
        >
          Shop now
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
      <Image
        src={image}
        alt={imageAlt}
        width={500}
        height={500}
        sizes="(max-width: 1024px) 38vw, 16vw"
        className="absolute -bottom-[7%] -right-[8%] h-[82%] w-[58%] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </article>
  )
}

function BenefitsStrip() {
  return (
    <div className="flex min-h-[72px] items-stretch overflow-hidden rounded-xl border border-[#DCE4DE] bg-white">
      <div className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {benefits.map(({ Icon, title, detail }, index) => (
          <div
            key={title}
            className={`flex min-w-[158px] flex-1 snap-start items-center gap-3 px-4 py-3 ${index ? 'border-l border-[#E5EAE6]' : ''}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${index === 4 ? 'bg-[#F26A32] text-white' : 'bg-[#EDF5EF] text-[#2F7148]'}`}>
              <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span className="min-w-0 text-[11px] font-bold leading-tight text-[#171B18]">
              <span className="block whitespace-nowrap">{title}</span>
              <span className="mt-0.5 block whitespace-nowrap font-medium text-[#68746D]">{detail}</span>
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/shop"
        aria-label="View all products"
        className="flex w-12 shrink-0 items-center justify-center border-l border-[#DCE4DE] text-[#183D2A] transition-colors hover:bg-[#EDF5EF]"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function Hero() {
  return (
    <section className="bg-[#F5F6F5] px-3 pb-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-2.5">
        <div className="grid gap-2.5 lg:h-[340px] lg:grid-cols-[1.62fr_1fr]">
          <article className="relative min-h-[500px] overflow-hidden rounded-xl border border-[#DCE4DE] bg-[#FAFAF7] sm:min-h-[430px] lg:min-h-0">
            <div className="relative z-10 max-w-[440px] p-6 sm:p-8 lg:max-w-[42%] lg:p-7 xl:p-9">
              <h1 className="text-[38px] font-black leading-[0.96] tracking-[-0.045em] text-[#183D2A] sm:text-[48px] lg:text-[44px] xl:text-[52px]">
                Power up
                <span className="mt-1 block whitespace-nowrap text-[#F26A32]">your world</span>
              </h1>
              <p className="mt-4 max-w-[270px] text-sm font-medium leading-relaxed text-[#4E5A53]">
                Top gadgets. Trusted brands. Unbeatable value.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/shop"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-[#183D2A] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#2F7148]"
                >
                  Shop now
                </Link>
                <Link
                  href="/deals"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#9DB1A3] bg-white px-5 text-xs font-extrabold text-[#183D2A] transition-colors hover:border-[#2F7148] hover:bg-[#EDF5EF]"
                >
                  Explore deals
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <Image
              src="/campaigns/power-up-gadget-cluster-v2.png"
              alt="Laptop, phones, smartwatch and headphones"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 640px) 96vw, (max-width: 1024px) 70vw, 52vw"
              className="absolute bottom-[58px] right-[-9%] h-[265px] w-[112%] object-contain object-right-bottom sm:bottom-[42px] sm:right-[-5%] sm:h-[310px] sm:w-[78%] lg:bottom-[10px] lg:right-[-4%] lg:h-[95%] lg:w-[72%]"
            />

            <div className="absolute bottom-4 left-5 z-10 flex items-center gap-4 rounded-lg bg-white/90 px-3 py-2 shadow-sm sm:left-7 lg:bottom-5">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-[#314038]">
                <ShieldCheck className="h-4 w-4 text-[#2F7148]" aria-hidden="true" /> 100% Authentic
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-[#314038]">
                <RotateCcw className="h-4 w-4 text-[#2F7148]" aria-hidden="true" /> 7-Day Returns
              </span>
              <span className="hidden items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-[#314038] xs:flex sm:flex">
                <Truck className="h-4 w-4 text-[#2F7148]" aria-hidden="true" /> Fast Delivery
              </span>
            </div>

            <div className="absolute bottom-5 right-5 z-10 flex gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2F7148]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9D2CC]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9D2CC]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9D2CC]" />
            </div>
          </article>

          <div className="grid grid-cols-2 gap-2.5">
            <PromoCard
              title="Up to 40% off Top sellers"
              description="Popular tech, ready to ship"
              href="/shop?sort=popular"
              image="/campaigns/power-up-earbuds-v2.png"
              imageAlt="Wireless earbuds in a charging case"
              tone="forest"
            />
            <PromoCard
              title="Smart living made easy"
              description="Home electronics for every home"
              href="/shop?search=smart%20home"
              image="/campaigns/power-up-camera-v2.png"
              imageAlt="Indoor smart security camera"
              tone="mint"
            />
            <PromoCard
              title="Sound that moves you"
              description="Speakers & Audio"
              price="From ₦18,900"
              href="/categories/speakers"
              image="/campaigns/power-up-speaker-v2.png"
              imageAlt="Portable wireless speaker"
              tone="white"
            />
            <PromoCard
              title="Stay cool anywhere"
              description="Rechargeable fans"
              price="From ₦12,900"
              href="/categories/rechargeable-fans"
              image="/campaigns/power-up-fan-v2.png"
              imageAlt="Rechargeable tabletop fan"
              tone="orange"
            />
          </div>
        </div>

        <BenefitsStrip />
      </div>
    </section>
  )
}
