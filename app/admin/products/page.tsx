'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Star, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService.getFlat().then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
  }, [])

  useEffect(() => {
    setLoading(true)
    productService.getAll({ limit: 100, search: search || undefined, category: categoryFilter !== 'all' ? categoryFilter : undefined })
      .then(r => { if ((r as any)?.data) setProducts((r as any).data) })
      .finally(() => setLoading(false))
  }, [search, categoryFilter])

  const filtered = products
  const parentCategoryIds = new Set(categories.filter(c => !c.parentId).map(c => c.id))

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await productService.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success(`"${name}" deleted`)
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">{products.length} products in the current view</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="appearance-none bg-card border border-border rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? `-- ${c.name}` : c.name}</option>)}
        </select>
        <Button asChild className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Link href="/admin/products/new"><Plus className="w-4 h-4" /> Add Product</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: products.length, icon: Package },
          { label: 'In Stock', value: products.filter(p => p.stock > 0).length, icon: Package },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, icon: Package },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

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
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Stock</th>
                  <th className="text-left px-4 py-3 font-medium">Rating</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                          <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className={cn(p.categoryId && !parentCategoryIds.has(p.categoryId) && 'text-foreground')}>
                        {p.category?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      ₦{p.price.toLocaleString()}
                      {p.comparePrice && <span className="text-xs text-muted-foreground line-through ml-1">₦{Number(p.comparePrice).toLocaleString()}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('font-mono text-xs font-bold', p.stock === 0 && 'text-destructive', p.stock > 0 && p.stock <= 5 && 'text-amber-600')}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="text-xs font-medium">{p.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.featured && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 border">Featured</Badge>}
                        {p.isNew && <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 border">New</Badge>}
                        {p.stock === 0 && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 border">OOS</Badge>}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
