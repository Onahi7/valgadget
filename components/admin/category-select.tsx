'use client'

import { Label } from '@/components/ui/label'
import { AdminSelect } from '@/components/admin/admin-controls'
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
      <AdminSelect
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Select a category</option>
        {parents.map(parent => {
          const children = childrenMap.get(parent.id) ?? []
          return (
            <optgroup key={parent.id} label={parent.name}>
              {/* Allow selecting the parent itself */}
              <option value={parent.id}>{parent.name}{!parent.isActive ? ' (inactive)' : ''}</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}{!child.isActive ? ' (inactive)' : ''}
                </option>
              ))}
            </optgroup>
          )
        })}
      </AdminSelect>
    </div>
  )
}
