'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/lib/api-client'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', comparePrice: '',
    sku: '', stock: '', categoryId: '', tags: '', featured: false, isNew: false, isActive: true,
  })

  useEffect(() => {
    Promise.all([
      productService.getById(id),
      categoryService.getFlat(),
    ]).then(([pr, cr]) => {
      const p = pr as any
      if (p?.id) {
        setProduct(p)
        setForm({
          name: p.name,
          description: p.description,
          shortDescription: p.shortDescription ?? '',
          price: String(p.price),
          comparePrice: p.comparePrice ? String(p.comparePrice) : '',
          sku: p.sku,
          stock: String(p.stock),
          categoryId: p.categoryId,
          tags: (p.tags ?? []).join(', '),
          featured: p.featured,
          isNew: p.isNew,
          isActive: p.isActive,
        })
      }
      if (Array.isArray(cr)) setCategories(cr as any[])
    }).finally(() => setLoading(false))
  }, [id])

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.sku) {
      toast.error('Name, price, and SKU are required')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      sku: form.sku.trim(),
      stock: Number(form.stock) || 0,
      categoryId: form.categoryId || undefined,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured: form.featured,
      isNew: form.isNew,
      isActive: form.isActive,
    }
    try {
      await productService.update(id, payload)
      toast.success('Product updated')
      router.push('/admin/products')
    } catch {
      toast.error('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => formData.append('images', file))
      const res = await productService.uploadImages(id, formData)
      if (res?.images) {
        setProduct((prev: any) => prev ? { ...prev, images: res.images } : prev)
        toast.success(`${files.length} image(s) uploaded`)
      }
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to upload images')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    setDeletingImageUrl(imageUrl)
    try {
      await productService.deleteImage(id, imageUrl)
      setProduct((prev: any) => prev ? {
        ...prev,
        images: (prev.images ?? []).filter((url: string) => url !== imageUrl)
      } : prev)
      toast.success('Image deleted')
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to delete image')
    } finally {
      setDeletingImageUrl(null)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
  if (!product) return <div className="py-20 text-center text-sm text-muted-foreground">Product not found</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Edit Product</h1>
          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 bg-primary text-primary-foreground">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Basic Info</h2>
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="Brief tagline" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="wireless, gaming, rgb" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Flags</h2>
            {([
              { key: 'featured', label: 'Featured product' },
              { key: 'isNew', label: 'Mark as New Arrival' },
              { key: 'isActive', label: 'Active (visible in store)' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={e => set(key, e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                  <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className="pl-7" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comparePrice">Compare Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                  <Input id="comparePrice" type="number" min="0" step="0.01" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} className="pl-7" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Inventory</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" value={form.sku} onChange={e => set('sku', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock Qty</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Organization</h2>
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={e => set('categoryId', e.target.value)}
                className="w-full appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— No category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-sm">Product Images</h2>

        {/* Existing Images */}
        {(product.images ?? []).length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {(product.images as string[]).map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`Product ${idx + 1}`} className="w-full h-24 object-cover" />
                <button
                  type="button"
                  disabled={deletingImageUrl === url || uploading}
                  onClick={() => handleDeleteImage(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
                >
                  {deletingImageUrl === url ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || !!deletingImageUrl}
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={uploading || !!deletingImageUrl}
              className={cn(uploading && 'opacity-50')}
            >
              <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading...' : 'Upload Images'}
              </label>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">Max 5MB per image. Supports JPG, PNG, WebP.</p>
        </div>
      </div>
    </form>
  )
}
