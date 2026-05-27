'use client'

import { ListPlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ProductSpec = { label: string; value: string }

type Props = {
  value: ProductSpec[]
  onChange: (next: ProductSpec[]) => void
  suggestedLabels?: string[]
  templateName?: string
}

export function SpecsEditor({ value, onChange, suggestedLabels = [], templateName }: Props) {
  const specs = value.length ? value : [{ label: '', value: '' }]
  const existingLabels = new Set(specs.map(spec => spec.label.trim().toLowerCase()).filter(Boolean))
  const missingSuggestedLabels = suggestedLabels.filter(label => !existingLabels.has(label.toLowerCase()))

  const update = (index: number, field: keyof ProductSpec, nextValue: string) => {
    const next = specs.map((spec, i) => (i === index ? { ...spec, [field]: nextValue } : spec))
    onChange(next)
  }

  const addRow = () => {
    onChange([...specs, { label: '', value: '' }])
  }

  const removeRow = (index: number) => {
    const next = specs.filter((_, i) => i !== index)
    onChange(next.length ? next : [{ label: '', value: '' }])
  }

  const addSuggestedRows = () => {
    const base = specs.filter(spec => spec.label.trim() || spec.value.trim())
    onChange([
      ...base,
      ...missingSuggestedLabels.map(label => ({ label, value: '' })),
    ])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Specifications</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {templateName ? `${templateName} rows for the product page.` : 'Add structured spec rows that appear on the product page.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {missingSuggestedLabels.length > 0 && (
            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addSuggestedRows}>
              <ListPlus className="h-3.5 w-3.5" />
              Use Template
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Add Spec
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {specs.map((spec, index) => (
          <div key={`${index}-${spec.label}-${spec.value}`} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto]">
            <Input
              value={spec.label}
              onChange={(e) => update(index, 'label', e.target.value)}
              placeholder="Label"
            />
            <Input
              value={spec.value}
              onChange={(e) => update(index, 'value', e.target.value)}
              placeholder="Value"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(index)}
              aria-label={`Remove spec row ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
