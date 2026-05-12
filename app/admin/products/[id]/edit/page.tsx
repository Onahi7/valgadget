'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, ImagePlus, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productService, type Product } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/lib/api-client'
import { ImageCropModal } from '@/components/admin/image-crop-modal'
import { SpecsEditor, type ProductSpec } from '@/components/admin/specs-editor'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null)
  const [specs, setSpecs] = useState<ProductSpec[]>([])

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', comparePrice: '',
    sku: '', stock: '', categoryId: '', tags: '', featured: false, isNew: false, isActive: true,
  })

  useEffect(() => {
    Promise.all([
      productService.getAdminById(id),
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
        setSpecs(Array.isArray(p.specs) ? p.specs : [])
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
      specs: specs.filter(spec => spec.label.trim() && spec.value.trim()),
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    const [first, ...rest] = files
    setCurrentCropFile(first)
    setCropQueue(rest)
    setCropModalOpen(true)
  }

  const uploadBlob = async (blob: Blob, filename: string) => {
    setUploading(true)
    try {
      const file = new File([blob], filename, { type: 'image/webp' })
      const formData = new FormData()
      formData.append('images', file)
      const res = await productService.uploadImages(id, formData)
      if (res?.images) {
        setProduct((prev: any) => prev ? { ...prev, images: res.images } : prev)
        toast.success('Image uploaded')
      }
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleCropConfirm = async (blob: Blob, filename: string) => {
    setCropModalOpen(false)
    setCurrentCropFile(null)
    await uploadBlob(blob, filename)
    if (cropQueue.length > 0) {
      const [next, ...remaining] = cropQueue
      setCropQueue(remaining)
      setCurrentCropFile(next)
      setCropModalOpen(true)
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    setCurrentCropFile(null)
    setCropQueue([])
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

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
  if (!product) return <div className="py-20 text-center text-sm text-muted-foreground">Product not found</div>

  const images = (product.images ?? []) as string[]

  return (
    <>
      <ImageCropModal
        open={cropModalOpen}
        file={currentCropFile}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
        label="Product Image"
        outputSize={800}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/admin/products"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
          </div>
          <Button type="submit" disabled={saving} className="gap-2 bg-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
              <SpecsEditor value={specs} onChange={setSpecs} />
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Product Images</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Images are auto-cropped and resized to 800×800px</p>
            </div>
            <div className="flex items-center gap-2">
              {uploading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading || !!deletingImageUrl || cropModalOpen}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || !!deletingImageUrl || cropModalOpen}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                Add Images
              </Button>
            </div>
          </div>

          {images.length === 0 && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !!deletingImageUrl || cropModalOpen}
              className={cn(
                'w-full border-2 border-dashed border-border rounded-lg py-10 flex flex-col items-center gap-2 transition-colors',
                'hover:border-primary/40 hover:bg-muted/30',
                (uploading || cropModalOpen) && 'opacity-50 pointer-events-none',
              )}
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Click to add product images</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG or WebP · Auto-fitted to 800×800px</p>
            </button>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((url: string, idx: number) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-2 h-2" /> Main
                    </span>
                  )}
                  <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    disabled={deletingImageUrl === url || uploading}
                    onClick={() => handleDeleteImage(url)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
                  >
                    {deletingImageUrl === url
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <X className="w-3 h-3" />
                    }
                  </button>
                </div>
              ))}

              {uploading && (
                <div className="aspect-square rounded-lg border-2 border-dashed border-primary/30 bg-muted/40 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-[10px] text-muted-foreground">Uploading</span>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </>
  )
}
