'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CONDITIONS = [
  { value: 'brand-new', label: 'Brand New', desc: 'Factory sealed' },
  { value: 'uk-used', label: 'UK Used', desc: 'Pre-owned from UK' },
  { value: 'us-used', label: 'US Used', desc: 'Pre-owned from US' },
  { value: 'naija-used', label: 'Naija Used', desc: 'Locally pre-owned' },
  { value: 'refurbished', label: 'Refurbished', desc: 'Professionally restored' },
  { value: 'open-box', label: 'Open Box', desc: 'Opened but unused' },
] as const

export type ProductCondition = typeof CONDITIONS[number]['value']

interface ConditionSelectProps {
  value: string
  onChange: (value: string) => void
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
        {CONDITIONS.map(condition => (
          <button
            key={condition.value}
            type="button"
            onClick={() => onChange(value === condition.value ? '' : condition.value)}
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
          {CONDITIONS.find(c => c.value === value)?.desc}
        </p>
      )}
    </div>
  )
}

/** Extract condition from tags array */
export function getConditionFromTags(tags: string[]): string {
  return tags.find(t => CONDITIONS.some(c => c.value === t)) ?? ''
}

/** Update tags array with new condition (removes old condition tag, adds new one) */
export function updateConditionInTags(tags: string[], newCondition: string): string[] {
  const conditionValues = CONDITIONS.map(c => c.value) as string[]
  const filtered = tags.filter(t => !conditionValues.includes(t))
  if (newCondition) filtered.push(newCondition)
  return filtered
}
