'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Star, Package, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AdminIconButton, AdminPageHeader, AdminSelect } from '@/components/admin/admin-controls'
import { useAdminConfirm } from '@/components/admin/admin-confirm-provider'
import { buildCategoryTree, flattenCategoryTree } from '@/lib/category-hierarchy'

function getDisplayImage(product: Product) {
  return product.displayImage ?? product.images?.find(src => src?.startsWith('/') || src?.includes('ik.imagekit.io')) ?? null
}

export default function AdminProductsPage() {
  const confirmAction = useAdminConfirm()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string>('')

  const PAGE_SIZE = 20
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    categoryService.getAdminAll()
      .then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    productService.getAdminAll({
      limit: PAGE_SIZE,
      page,
      search: debouncedSearch || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
    })
      .then(r => {
        const res = r as any
        if (res?.data) setProducts(res.data)
        setTotalPages(res?.totalPages ?? 1)
        setTotal(res?.total ?? 0)
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }, [debouncedSearch, categoryFilter, activeFilter, page])

  const filtered = products
  const categoryOptions = useMemo(
    () => flattenCategoryTree(buildCategoryTree(categories)),
    [categories],
  )
  const nestedCategoryIds = useMemo(
    () => new Set(categoryOptions.filter(category => category.depth > 0).map(category => category.id)),
    [categoryOptions],
  )

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: 'Delete product?',
      description: `“${name}” will be permanently removed from the catalog. This cannot be undone.`,
      confirmLabel: 'Delete product',
      tone: 'destructive',
    })
    if (!confirmed) return
    try {
      await productService.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
      toast.success(`"${name}" deleted`)
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  const executeBulk = async () => {
    if (!bulkAction || selected.size === 0) return
    const ids = [...selected]
    if (bulkAction === 'delete') {
      const confirmed = await confirmAction({
        title: `Delete ${ids.length} products?`,
        description: 'The selected products will be permanently removed from the catalog. This cannot be undone.',
        confirmLabel: 'Delete products',
        tone: 'destructive',
      })
      if (!confirmed) return
      let ok = 0
      for (const id of ids) {
        try { await productService.delete(id); ok++ } catch {}
      }
      setProducts(prev => prev.filter(p => !selected.has(p.id)))
      setSelected(new Set())
      toast.success(`${ok} products deleted`)
    } else if (bulkAction === 'activate' || bulkAction === 'deactivate') {
      const isActive = bulkAction === 'activate'
      let ok = 0
      for (const id of ids) {
        try {
          await productService.update(id, { isActive } as any)
          ok++
        } catch {}
      }
      setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, isActive } : p))
      setSelected(new Set())
      toast.success(`${ok} products ${isActive ? 'activated' : 'deactivated'}`)
    }
    setBulkAction('')
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <AdminPageHeader title="Products" description={`${total} products`} actions={
        <Button asChild className="w-full gap-2 sm:w-auto">
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add Product</Link>
        </Button>
      } />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <AdminSelect
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          aria-label="Filter products by category"
          containerClassName="w-full sm:w-52"
        >
          <option value="all">All Categories</option>
          {categoryOptions.map(c => (
            <option key={c.id} value={c.id}>
              {c.path.join(' / ')}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1) }}
          aria-label="Filter products by status"
          containerClassName="w-full sm:w-44"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </AdminSelect>
      </div>

      {/* Stats row (scoped to the current page of results) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Products', value: total, icon: Package },
          { label: 'Active · this page', value: products.filter(p => p.isActive).length, icon: Package },
          { label: 'Needs image · this page', value: products.filter(p => !getDisplayImage(p)).length, icon: Package },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <AdminSelect
            value={bulkAction}
            onChange={e => setBulkAction(e.target.value)}
            aria-label="Choose bulk action"
            containerClassName="w-44"
            className="h-9"
          >
            <option value="">Bulk Actions</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </AdminSelect>
          <Button size="sm" onClick={executeBulk} disabled={!bulkAction}>Apply</Button>
          <AdminIconButton size="sm" label="Clear product selection" onClick={() => setSelected(new Set())}>
            <X className="w-4 h-4" />
          </AdminIconButton>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg py-12 text-center text-sm text-muted-foreground">
          Loading products...
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package className="size-6" /></EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>Try a different search or filter.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="text-left px-3 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all products on this page"
                      checked={products.length > 0 && selected.size === products.length}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Rating</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const displayImage = getDisplayImage(p)

                  return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                          {displayImage ? (
                            <Image src={displayImage} alt={p.name} width={40} height={40} className="h-full w-full object-contain bg-white p-1" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">Needs image</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className={cn(p.categoryId && nestedCategoryIds.has(p.categoryId) && 'text-foreground')}>
                        {p.category?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      ₦{p.price.toLocaleString()}
                      {p.comparePrice && <span className="text-xs text-muted-foreground line-through ml-1">₦{Number(p.comparePrice).toLocaleString()}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="text-xs font-medium">{p.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={cn('border text-[10px]', p.isActive ? 'border-green-200 bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {!displayImage ? (
                          <Badge className="border border-amber-200 bg-amber-100 text-[10px] text-amber-700">Needs image</Badge>
                        ) : p.featured ? (
                          <Badge className="border border-primary/20 bg-primary/10 text-[10px] text-primary">Featured</Badge>
                        ) : p.isNew ? (
                          <Badge className="border border-blue-200 bg-blue-50 text-[10px] text-blue-700">New</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${p.name}`}
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
