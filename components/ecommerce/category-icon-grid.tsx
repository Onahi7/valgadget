import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BatteryCharging,
  Camera,
  Fan,
  Gamepad2,
  Headphones,
  Monitor,
  MousePointer2,
  Package,
  Smartphone,
  Speaker,
  Watch,
  type LucideIcon,
} from 'lucide-react'

export interface CategoryIcon {
  slug: string
  name: string
  href: string
  available?: boolean
  image?: string | null
}

interface CategoryIconGridProps {
  title?: string
  categories: CategoryIcon[]
  className?: string
}

const categoryIconMatchers: Array<[string[], LucideIcon]> = [
  [['monitor', 'display', 'laptop', 'computer'], Monitor],
  [['fan', 'appliance'], Fan],
  [['speaker', 'sound'], Speaker],
  [['iphone', 'android', 'phone', 'tablet'], Smartphone],
  [['watch', 'wearable'], Watch],
  [['power', 'battery', 'charger'], BatteryCharging],
  [['headphone', 'earbud', 'audio'], Headphones],
  [['mouse', 'keyboard', 'peripheral', 'accessor'], MousePointer2],
  [['game', 'console'], Gamepad2],
  [['camera'], Camera],
]

function getCategoryIcon(category: CategoryIcon) {
  const searchableName = `${category.slug} ${category.name}`.toLowerCase()
  return categoryIconMatchers.find(([keywords]) =>
    keywords.some(keyword => searchableName.includes(keyword)),
  )?.[1] ?? Package
}

/** Dense marketplace category rail modelled on familiar Nigerian ecommerce patterns. */
export function CategoryIconGrid({
  title = 'Shop by Categories',
  categories,
  className = '',
}: CategoryIconGridProps) {
  if (categories.length === 0) return null

  return (
    <section id="categories" className={`scroll-mt-36 bg-[#F5F6F5] py-3 ${className}`}>
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          </div>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline sm:text-sm"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="-mx-3 flex snap-x gap-2.5 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label="Shop categories; scroll for more">
          {[...categories].sort((a, b) => Number(b.available !== false) - Number(a.available !== false)).map(category => {
            const Icon = getCategoryIcon(category)

            if (category.available === false) return (
              <div key={category.slug} aria-disabled="true" className="flex h-32 w-28 shrink-0 snap-start flex-col items-center rounded-md border border-dashed border-border bg-white px-2 py-3 text-center text-muted-foreground sm:w-36">
                <span className="mb-2 grid h-16 w-full place-items-center bg-muted"><Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.5} /></span>
                <span className="text-xs font-semibold sm:text-sm">{category.name}</span>
                <span className="mt-1 text-[10px] uppercase">Coming soon</span>
              </div>
            )

            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex h-32 w-28 shrink-0 snap-start flex-col items-center rounded-md border border-border bg-white px-2 py-3 text-center transition-colors hover:border-primary sm:w-36"
              >
                <span className="relative mb-2 grid h-16 w-full place-items-center overflow-hidden bg-white text-primary">
                  {category.image ? <Image src={category.image} alt="" fill sizes="144px" className="object-contain p-1 transition-transform group-hover:scale-105" unoptimized /> : <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.5} />}
                </span>
                <span className="line-clamp-2 text-xs font-semibold leading-4 text-foreground sm:text-sm">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
