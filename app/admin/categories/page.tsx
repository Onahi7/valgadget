'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ImageCropModal } from '@/components/admin/image-crop-modal'
import { categoryService } from '@/lib/services/category.service'
import type { Category, CreateCategoryPayload } from '@/lib/services/category.service'
import { toast } from 'sonner'
import { isApiError } from '@/lib/api-client'
import { AdminIconButton, AdminPageHeader, AdminSelect } from '@/components/admin/admin-controls'
import { useAdminConfirm } from '@/components/admin/admin-confirm-provider'
import { buildCategoryTree, flattenCategoryTree, getCategoryDescendantSet } from '@/lib/category-hierarchy'

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

function getDisplayImage(category: Category) {
  return category.displayImage ?? (category.image && !category.image.includes('source.unsplash.com') ? category.image : null)
}

function toPayload(form: CategoryForm): CreateCategoryPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined,
    icon: form.icon.trim() || undefined,
    parentId: form.parentId || null,
    isActive: form.isActive,
    sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
  }
}

export default function AdminCategoriesPage() {
  const confirmAction = useAdminConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [search, setSearch] = useState('')
  const [viewFilter, setViewFilter] = useState('all')

  const loadCategories = async () => {
    setLoading(true)
    try {
      const result = await categoryService.getAdminAll()
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
  const hierarchyRows = useMemo(
    () => flattenCategoryTree(buildCategoryTree(categories)),
    [categories],
  )
  const hierarchyById = useMemo(
    () => new Map(hierarchyRows.map(category => [category.id, category])),
    [hierarchyRows],
  )
  const unavailableParentIds = useMemo(() => {
    if (!editingId) return new Set<string>()
    const ids = getCategoryDescendantSet(categories, editingId)
    ids.add(editingId)
    return ids
  }, [categories, editingId])

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    return categories.filter(category => {
      const matchesSearch = !query || [category.name, category.description, category.slug]
        .some(value => value?.toLowerCase().includes(query))
      const hasProducts = (category.productCount ?? 0) > 0
      const matchesView = viewFilter === 'all'
        || (viewFilter === 'parents' && !category.parentId)
        || (viewFilter === 'children' && Boolean(category.parentId))
        || (viewFilter === 'visible' && category.isActive && hasProducts)
        || (viewFilter === 'waiting' && category.isActive && !hasProducts)
        || (viewFilter === 'inactive' && !category.isActive)
      return matchesSearch && matchesView
    })
  }, [categories, search, viewFilter])

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
    setCropFile(null)
    setCropModalOpen(false)
  }

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    setCropFile(file)
    setCropModalOpen(true)
  }

  const handleCropClose = () => {
    if (uploadingImage) return
    setCropModalOpen(false)
    setCropFile(null)
  }

  const handleCropConfirm = async (blob: Blob, filename: string) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', new File([blob], filename, { type: 'image/webp' }))
      const uploaded = await categoryService.uploadImage(formData)
      setForm(prev => ({ ...prev, image: uploaded.url }))
      setCropModalOpen(false)
      setCropFile(null)
      toast.success('Category image uploaded')
    } catch {
      toast.error('Failed to upload category image')
    } finally {
      setUploadingImage(false)
    }
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
    } catch (error) {
      toast.error(isApiError(error) ? error.message : editingId ? 'Failed to update category' : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: 'Delete category?',
      description: `“${name}” will be removed. Products assigned to it may need a new category.`,
      confirmLabel: 'Delete category',
      tone: 'destructive',
    })
    if (!confirmed) return
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

    const previous = categories
    setCategories(next)

    try {
      await categoryService.reorder(next.map(category => ({ id: category.id, sortOrder: category.sortOrder ?? 0 })))
    } catch {
      setCategories(previous)
      toast.error('Failed to reorder categories')
    }
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <ImageCropModal
        open={cropModalOpen}
        file={cropFile}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
        aspectRatio={16 / 9}
        outputSize={1200}
        label="Category Image"
      />

      <AdminPageHeader title="Categories" description={`${categories.length} categories across ${Math.max(0, ...hierarchyRows.map(category => category.depth + 1))} hierarchy levels`} actions={
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      } />

      {editorOpen && (
        <div className="rounded-lg border border-primary/20 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <p className="text-sm text-muted-foreground">Manage name, hierarchy, visibility, and media fields in one place.</p>
            </div>
            <AdminIconButton size="sm" label="Close category editor" onClick={closeEditor}>
              <X className="h-4 w-4" />
            </AdminIconButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">Name</label>
              <Input id="category-name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="category-parent" className="text-sm font-medium">Parent Category</label>
              <AdminSelect
                id="category-parent"
                value={form.parentId}
                onChange={event => setForm(prev => ({ ...prev, parentId: event.target.value }))}
              >
                <option value="">No parent</option>
                {hierarchyRows
                  .filter(category => !unavailableParentIds.has(category.id))
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {`${'— '.repeat(category.depth)}${category.path.join(' / ')}`}
                    </option>
                  ))}
              </AdminSelect>
              <p className="text-xs text-muted-foreground">Choose any category to create the next level. Example: Phones → Samsung → UK Used.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="category-description" className="text-sm font-medium">Description</label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                placeholder="Short internal description for this category"
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category-image" className="text-sm font-medium">Category image</label>
              <div className="flex gap-2">
                <Input id="category-image" value={form.image} onChange={event => setForm(prev => ({ ...prev, image: event.target.value }))} placeholder="Paste an image URL or upload a file" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Recommended: upload a landscape image. It will be cropped to 1200×675 WebP.</p>
              {form.image && !form.image.includes('source.unsplash.com') && (
                <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
                  <Image src={form.image} alt={form.name || 'Category preview'} fill className="object-cover" unoptimized />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                    aria-label="Clear category image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {form.image.includes('source.unsplash.com') && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This category still has an old seed image URL. Upload a new image to replace it.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="category-sort" className="text-sm font-medium">Sort Order</label>
              <Input
                id="category-sort"
                type="number"
                value={form.sortOrder}
                onChange={event => setForm(prev => ({ ...prev, sortOrder: Number(event.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category-status" className="text-sm font-medium">Status</label>
              <AdminSelect
                id="category-status"
                value={form.isActive ? 'active' : 'inactive'}
                onChange={event => setForm(prev => ({ ...prev, isActive: event.target.value === 'active' }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </AdminSelect>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="pl-9"
          />
        </div>
        <AdminSelect
          value={viewFilter}
          onChange={event => setViewFilter(event.target.value)}
          aria-label="Filter categories"
          containerClassName="w-full sm:w-48"
        >
          <option value="all">All categories</option>
          <option value="parents">Top-level categories</option>
          <option value="children">Nested categories</option>
          <option value="visible">Visible on storefront</option>
          <option value="waiting">Waiting for products</option>
          <option value="inactive">Inactive</option>
        </AdminSelect>
        <span className="text-sm text-muted-foreground sm:ml-auto">{visibleCategories.length} shown</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Image</th>
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
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading categories...</td>
                </tr>
              ) : visibleCategories.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No categories match these filters.</td></tr>
              ) : visibleCategories.map(category => {
                const index = categories.findIndex(item => item.id === category.id)
                const displayImage = getDisplayImage(category)
                const hasStorefrontProducts = (category.productCount ?? 0) > 0

                return (
                <tr key={category.id} className="border-b border-border/50 transition-colors hover:bg-accent/20">
                  <td className="px-5 py-3">
                    <div className="h-11 w-14 overflow-hidden rounded-md border border-border bg-muted">
                      {displayImage ? (
                        <Image src={displayImage} alt={category.name} width={56} height={44} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">Needs image</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-1">
                      <p className="font-medium" style={{ paddingLeft: `${(hierarchyById.get(category.id)?.depth ?? 0) * 14}px` }}>
                        {category.name}
                      </p>
                      {(hierarchyById.get(category.id)?.path.length ?? 0) > 1 ? (
                        <p className="text-xs text-muted-foreground">{hierarchyById.get(category.id)?.path.join(' / ')}</p>
                      ) : null}
                      {category.description && <p className="line-clamp-2 text-xs text-muted-foreground">{category.description}</p>}
                      {!displayImage && <Badge className="border border-amber-200 bg-amber-100 text-[10px] text-amber-700">Needs image</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{category.parentId ? categoryNameById.get(category.parentId) ?? '-' : '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{category.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{category.productCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="min-w-8 text-xs text-muted-foreground">{category.sortOrder ?? 0}</span>
                      <AdminIconButton size="sm" label={`Move ${category.name} up`} disabled={index === 0} onClick={() => moveCategory(index, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </AdminIconButton>
                      <AdminIconButton size="sm" label={`Move ${category.name} down`} disabled={index === categories.length - 1} onClick={() => moveCategory(index, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </AdminIconButton>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={!category.isActive
                      ? 'border text-[11px] text-muted-foreground'
                      : hasStorefrontProducts
                        ? 'border border-green-200 bg-green-100 text-[11px] text-green-700'
                        : 'border border-amber-200 bg-amber-50 text-[11px] text-amber-700'}>
                      {!category.isActive ? 'Inactive' : hasStorefrontProducts ? 'Visible' : 'Waiting for product'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminIconButton size="sm" label={`Edit ${category.name}`} onClick={() => openEdit(category)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </AdminIconButton>
                      <AdminIconButton size="sm" label={`Delete ${category.name}`} className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(category.id, category.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminIconButton>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
