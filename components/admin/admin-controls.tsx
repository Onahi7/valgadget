'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type AdminSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className, containerClassName, children, ...props }, ref) => (
    <div className={cn('relative min-w-0', containerClassName)}>
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-card py-2 pl-3 pr-10 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color]',
          'hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  ),
)
AdminSelect.displayName = 'AdminSelect'

type AdminIconButtonProps = Omit<React.ComponentProps<typeof Button>, 'size'> & {
  label: string
  size?: 'sm' | 'default'
}

export function AdminIconButton({ label, size = 'default', className, ...props }: AdminIconButtonProps) {
  return (
    <Button
      type="button"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      variant="ghost"
      aria-label={label}
      title={label}
      className={cn('rounded-lg text-muted-foreground hover:text-foreground', className)}
      {...props}
    />
  )
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
