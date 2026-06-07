import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

/**
 * Industry-standard designed empty state.
 * Illustration/icon + headline + supporting text + primary CTA (+ optional secondary).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in ${className}`}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button asChild={!!action.href} onClick={action.onClick}>
              {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" asChild={!!secondaryAction.href} onClick={secondaryAction.onClick}>
              {secondaryAction.href ? <Link href={secondaryAction.href}>{secondaryAction.label}</Link> : secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
