import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  href?: string
  context?: 'light' | 'dark'
  size?: 'sm' | 'md'
  className?: string
}

export function BrandMark({ href = '/', context = 'light', size = 'md', className }: BrandMarkProps) {
  const logoSize = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11'
  const nameSize = size === 'sm' ? 'text-sm' : 'text-base sm:text-lg'
  const subSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'
  const textColor = context === 'dark' ? 'text-secondary-foreground' : 'text-foreground'
  const mutedColor = context === 'dark' ? 'text-secondary-foreground/60' : 'text-muted-foreground'

  return (
    <Link href={href} className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <span className={cn('relative shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-border/70', logoSize)}>
        <Image src="/logo.png" alt="Val Gadgets logo" fill sizes="44px" className="object-contain p-1" priority />
      </span>
      <span className="min-w-0 leading-none">
        <span className={cn('block truncate font-black tracking-normal', nameSize, textColor)}>Val Gadgets</span>
        <span className={cn('mt-1 hidden truncate font-mono uppercase tracking-widest sm:block', subSize, mutedColor)}>
          Gadget plug
        </span>
      </span>
    </Link>
  )
}
