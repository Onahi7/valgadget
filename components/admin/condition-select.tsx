'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const PRODUCT_CONDITIONS = [
  { value: 'brand-new', label: 'Brand New', desc: 'Factory sealed' },
  { value: 'uk-used', label: 'UK Used', desc: 'Pre-owned from UK' },
  { value: 'us-used', label: 'US Used', desc: 'Pre-owned from US' },
  { value: 'naija-used', label: 'Naija Used', desc: 'Locally pre-owned' },
  { value: 'refurbished', label: 'Refurbished', desc: 'Professionally restored' },
  { value: 'open-box', label: 'Open Box', desc: 'Opened but unused' },
] as const

export type ProductCondition = typeof PRODUCT_CONDITIONS[number]['value']

interface ConditionSelectProps {
  value: ProductCondition
  onChange: (value: ProductCondition) => void
}

/**
 * Product condition selector — maps to a tag value.
 * Renders as pill buttons for quick selection.
 */
export function ConditionSelect({ value, onChange }: ConditionSelectProps) {
  return (
    <div className="space-y-2">
      <Label>Condition</Label>
      <div className="flex flex-wrap gap-2">
        {PRODUCT_CONDITIONS.map(condition => (
          <button
            key={condition.value}
            type="button"
            onClick={() => onChange(condition.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              value === condition.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {condition.label}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-[11px] text-muted-foreground">
          {PRODUCT_CONDITIONS.find(c => c.value === value)?.desc}
        </p>
      )}
    </div>
  )
}

/** Extract condition from tags array */
export function getConditionFromTags(tags: string[]): ProductCondition {
  return (tags.find(t => PRODUCT_CONDITIONS.some(c => c.value === t)) as ProductCondition | undefined) ?? 'brand-new'
}

/** Update tags array with new condition (removes old condition tag, adds new one) */
export function updateConditionInTags(tags: string[], newCondition: ProductCondition): string[] {
  const conditionValues = PRODUCT_CONDITIONS.map(c => c.value) as string[]
  const filtered = tags.filter(t => !conditionValues.includes(t))
  if (newCondition) filtered.push(newCondition)
  return filtered
}
