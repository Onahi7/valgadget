'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { categoryService } from '@/lib/services/category.service'
import type { Category, CreateCategoryPayload } from '@/lib/services/category.service'
import { toast } from 'sonner'

type CategoryForm = {
  name: string
  description: string
  image: string
  icon: string
  parentId: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  image: '',
  icon: '',
  parentId: '',
  isActive: true,
  sortOrder: 0,
}

function toPayload(form: CategoryForm): CreateCategoryPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined,
    icon: form.icon.trim() || undefined,
    parentId: form.parentId || undefined,
    isActive: form.isActive,
    sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const result = await categoryService.getFlat()
      if (Array.isArray(result)) {
        const ordered = [...result].sort((a, b) => {
          const sortDelta = (b.sortOrder ?? 0) - (a.sortOrder ?? 0)
          if (sortDelta !== 0) return sortDelta
          return a.name.localeCompare(b.name)
        })
        setCategories(ordered)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const categoryNameById = useMemo(
    () => new Map(categories.map(category => [category.id, category.name])),
    [categories]
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      sortOrder: categories.length ? Math.max(...categories.map(cat => cat.sortOrder ?? 0)) + 1 : 0,
    })
    setEditorOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
      icon: category.icon ?? '',
      parentId: category.parentId ?? '',
      isActive: category.isActive,
      sortOrder: category.sortOrder ?? 0,
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setSaving(true)
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await categoryService.update(editingId, payload)
        setCategories(prev =>
          prev
            .map(category => (category.id === editingId ? { ...category, ...(updated as Category) } : category))
            .sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0) || a.name.localeCompare(b.name))
        )
        toast.success('Category updated')
      } else {
        const created = await categoryService.create(payload)
        setCategories(prev =>
          [...prev, created as Category].sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0) || a.name.localeCompare(b.name))
        )
        toast.success('Category created')
      }
      closeEditor()
    } catch {
      toast.error(editingId ? 'Failed to update category' : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await categoryService.delete(id)
      setCategories(prev => prev.filter(category => category.id !== id))
      toast.success(`"${name}" deleted`)
      if (editingId === id) closeEditor()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const reordered = [...categories]
    const current = reordered[index]
    const target = reordered[targetIndex]
    reordered[index] = target
    reordered[targetIndex] = current

    const next = reordered.map((category, position, list) => ({
      ...category,
      sortOrder: list.length - position,
    }))

    setCategories(next)

    try {
      await categoryService.reorder(next.map(category => ({ id: category.id, sortOrder: category.sortOrder ?? 0 })))
    } catch {
      setCategories(categories)
      toast.error('Failed to reorder categories')
    }
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories and subcategories</p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {editorOpen && (
        <div className="rounded-lg border border-primary/20 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <p className="text-sm text-muted-foreground">Manage name, hierarchy, visibility, and media fields in one place.</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={closeEditor}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Category</label>
              <select
                value={form.parentId}
                onChange={event => setForm(prev => ({ ...prev, parentId: event.target.value }))}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No parent</option>
                {categories
                  .filter(category => category.id !== editingId)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                placeholder="Short internal description for this category"
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input value={form.image} onChange={event => setForm(prev => ({ ...prev, image: event.target.value }))} placeholder="/catalog/categories/monitors.jpg" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <Input value={form.icon} onChange={event => setForm(prev => ({ ...prev, icon: event.target.value }))} placeholder="monitor-smartphone" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={event => setForm(prev => ({ ...prev, sortOrder: Number(event.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={event => setForm(prev => ({ ...prev, isActive: event.target.value === 'active' }))}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Category'}
            </Button>
            <Button variant="outline" onClick={closeEditor}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Parent</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Products</th>
                <th className="px-4 py-3 text-left font-medium">Sort</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading categories...</td>
                </tr>
              ) : categories.map((category, index) => (
                <tr key={category.id} className="border-b border-border/50 transition-colors hover:bg-accent/20">
                  <td className="px-5 py-3">
                    <div className="space-y-1">
                      <p className="font-medium">{category.parentId ? `— ${category.name}` : category.name}</p>
                      {category.description && <p className="line-clamp-2 text-xs text-muted-foreground">{category.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{category.parentId ? categoryNameById.get(category.parentId) ?? '-' : '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{category.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{category.productCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="min-w-8 text-xs text-muted-foreground">{category.sortOrder ?? 0}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => moveCategory(index, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === categories.length - 1} onClick={() => moveCategory(index, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={category.isActive ? 'border border-green-200 bg-green-100 text-[11px] text-green-700' : 'border text-[11px] text-muted-foreground'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(category)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(category.id, category.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
