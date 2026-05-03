'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { categoryService } from '@/lib/services/category.service'
import type { Category } from '@/lib/services/category.service'
import { toast } from 'sonner'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService.getFlat()
      .then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
      .finally(() => setLoading(false))
  }, [])
  const [editId, setEditId]         = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [adding, setAdding]         = useState(false)
  const [newName, setNewName]       = useState('')
  const categoryNameById = new Map(categories.map(cat => [cat.id, cat.name]))

  const startEdit = (cat: Category) => { setEditId(cat.id); setEditName(cat.name) }
  const cancelEdit = () => { setEditId(null); setEditName('') }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    try {
      await categoryService.update(id, { name: editName.trim() })
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c))
      toast.success('Category updated')
    } catch { toast.error('Failed to update') }
    cancelEdit()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await categoryService.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success(`"${name}" deleted`)
    } catch { toast.error('Failed to delete') }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      const created = await categoryService.create({ name: newName.trim() })
      setCategories(prev => [...prev, created as any])
      toast.success(`"${newName.trim()}" created`)
    } catch { toast.error('Failed to create category') }
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories and subcategories</p>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-card border border-primary/30 rounded-lg p-4 flex items-center gap-3">
          <Input
            autoFocus
            placeholder="Category name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
          />
          <Button size="sm" onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Check className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Parent</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Products</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Loading categories...</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3">
                  {editId === cat.id ? (
                    <Input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit() }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <span className="font-medium">{cat.parentId ? `-- ${cat.name}` : cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{cat.parentId ? categoryNameById.get(cat.parentId) ?? '-' : '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge className={cat.isActive ? 'bg-green-100 text-green-700 border-green-200 border text-[11px]' : 'bg-muted text-muted-foreground border text-[11px]'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === cat.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveEdit(cat.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(cat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
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
