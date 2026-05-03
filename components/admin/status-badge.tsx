import { cn } from '@/lib/utils'

type StatusVariant =
  | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  | 'paid' | 'failed'
  | 'active' | 'upcoming' | 'completed' | 'drawing'
  | 'customer' | 'affiliate' | 'admin'

const STATUS_MAP: Record<StatusVariant, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped:    { label: 'Shipped',    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  delivered:  { label: 'Delivered',  className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded:   { label: 'Refunded',   className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  paid:       { label: 'Paid',       className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed:     { label: 'Failed',     className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  active:     { label: 'Active',     className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  upcoming:   { label: 'Upcoming',   className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:  { label: 'Completed',  className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  drawing:    { label: 'Drawing',    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  customer:   { label: 'Customer',   className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  affiliate:  { label: 'Affiliate',  className: 'bg-primary/10 text-primary' },
  admin:      { label: 'Admin',      className: 'bg-secondary text-secondary-foreground' },
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono uppercase tracking-wide',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  )
}
