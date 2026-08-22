import Link from 'next/link'
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

/** Compact icon navigation that stays scannable without competing with products. */
export function CategoryIconGrid({
  title = 'Shop by Categories',
  categories,
  className = '',
}: CategoryIconGridProps) {
  if (categories.length === 0) return null

  return (
    <section className={`bg-background py-10 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Quick shop
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          </div>
          <Link
            href="/categories"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-teal transition-colors hover:text-primary sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          {categories.slice(0, 8).map(category => {
            const Icon = getCategoryIcon(category)

            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex min-w-[112px] snap-start flex-col items-center rounded-2xl border border-border bg-white px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:w-36 sm:min-w-0"
              >
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
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
