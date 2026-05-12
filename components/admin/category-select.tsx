'use client'

import { Label } from '@/components/ui/label'
import type { Category } from '@/lib/services/category.service'

interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  id?: string
  label?: string
}

/**
 * Category dropdown that shows parent → child hierarchy with indentation.
 * Groups child categories under their parent for easy selection.
 */
export function CategorySelect({ categories, value, onChange, id = 'categoryId', label = 'Category' }: CategorySelectProps) {
  // Build tree: separate parents and children
  const parents = categories.filter(c => !c.parentId)
  const childrenMap = new Map<string, Category[]>()

  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) ?? []
      existing.push(c)
      childrenMap.set(c.parentId, existing)
    }
  })

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">— No category —</option>
        {parents.map(parent => {
          const children = childrenMap.get(parent.id) ?? []
          return (
            <optgroup key={parent.id} label={parent.name}>
              {/* Allow selecting the parent itself */}
              <option value={parent.id}>{parent.name} (All)</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          )
        })}
        {/* Categories without a parent that also aren't parents themselves (standalone) */}
        {categories
          .filter(c => !c.parentId && !childrenMap.has(c.id))
          .length > 0 && (
          <optgroup label="Other">
            {categories
              .filter(c => !c.parentId && !childrenMap.has(c.id))
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </optgroup>
        )}
      </select>
    </div>
  )
}
