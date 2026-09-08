'use client'

import { Label } from '@/components/ui/label'
import { AdminSelect } from '@/components/admin/admin-controls'
import type { Category } from '@/lib/services/category.service'
import { buildCategoryTree, flattenCategoryTree } from '@/lib/category-hierarchy'

interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  id?: string
  label?: string
}

/**
 * Category dropdown that supports any hierarchy depth and shows the full path.
 * New assignments are limited to leaf categories so products stay specific.
 */
export function CategorySelect({ categories, value, onChange, id = 'categoryId', label = 'Category' }: CategorySelectProps) {
  const options = flattenCategoryTree(buildCategoryTree(categories))

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <AdminSelect
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Select a category</option>
        {options.map(category => {
          const isGroup = category.children.length > 0
          return (
            <option
              key={category.id}
              value={category.id}
              disabled={!category.isActive || (isGroup && category.id !== value)}
            >
              {`${'— '.repeat(category.depth)}${category.path.join(' / ')}`}
              {!category.isActive ? ' (inactive)' : isGroup ? ' (choose a more specific category)' : ''}
            </option>
          )
        })}
      </AdminSelect>
      <p className="text-xs text-muted-foreground">Select the most specific category. Parent categories organize the storefront automatically.</p>
    </div>
  )
}
