'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Upload, X, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SpecsEditor, type ProductSpec } from '@/components/admin/specs-editor'
import { CategorySelect } from '@/components/admin/category-select'
import { ConditionSelect, updateConditionInTags } from '@/components/admin/condition-select'
import { ImageCropModal } from '@/components/admin/image-crop-modal'
import { productService } from '@/lib/services/product.service'
import { categoryService, type Category } from '@/lib/services/category.service'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [specs, setSpecs] = useState<ProductSpec[]>([])
  const [condition, setCondition] = useState('')
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null)
  const [croppedBlobs, setCroppedBlobs] = useState<{ blob: Blob; name: string }[]>([])
  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', comparePrice: '',
    sku: '', stock: '0', categoryId: '', tags: '', featured: false, isNew: true, isActive: true,
  })

  useEffect(() => {
    categoryService.getFlat().then(r => { if (Array.isArray(r)) setCategories(r as any[]) })
  }, [])

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const picked = Array.from(files).filter(file => file.type.startsWith('image/'))
    e.target.value = ''
    if (picked.length === 0) return
    const [first, ...rest] = picked
    setCurrentCropFile(first)
    setCropQueue(rest)
    setCropModalOpen(true)
  }

  const handleCropConfirm = (blob: Blob, filename: string) => {
    setCropModalOpen(false)
    setCurrentCropFile(null)
    setCroppedBlobs(prev => [...prev, { blob, name: filename }])
    // Process next in queue
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

  const removeCroppedImage = (index: number) => {
    setCroppedBlobs(prev => prev.filter((_, i) => i !== index))
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.sku) {
      toast.error('Name, price, and SKU are required')
      return
    }
    setSaving(true)
    try {
      const res = await productService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        specs: specs.filter(spec => spec.label.trim() && spec.value.trim()),
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        sku: form.sku.trim(),
        stock: Number(form.stock) || 0,
        categoryId: form.categoryId || '',
        tags: updateConditionInTags(form.tags.split(',').map(t => t.trim()).filter(Boolean), condition),
        featured: form.featured,
        isNew: form.isNew,
        isActive: form.isActive,
      })

      if (croppedBlobs.length > 0) {
        setUploadingImages(true)
        const formData = new FormData()
        croppedBlobs.forEach(({ blob, name }) => {
          formData.append('images', new File([blob], name, { type: 'image/webp' }))
        })
        await productService.uploadImages(res.id, formData)
        toast.success(`"${form.name}" created with ${croppedBlobs.length} image(s).`)
      } else if (selectedImages.length > 0) {
        setUploadingImages(true)
        const formData = new FormData()
        selectedImages.forEach(file => formData.append('images', file))
        await productService.uploadImages(res.id, formData)
        toast.success(`"${form.name}" created with ${selectedImages.length} image(s).`)
      } else {
        toast.success(`"${form.name}" created.`)
      }

      router.push(`/admin/products/${res.id}/edit`)
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to create product')
    } finally {
      setUploadingImages(false)
      setSaving(false)
    }
  }

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
          <h1 className="text-xl font-bold">New Product</h1>
          <p className="text-xs text-muted-foreground">Fill in the details to add to your catalog</p>
        </div>
        <Button type="submit" disabled={saving || uploadingImages} className="gap-2 bg-primary text-primary-foreground">
          {(saving || uploadingImages) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {uploadingImages ? 'Uploading Images...' : saving ? 'Creating...' : 'Create Product'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Basic Info</h2>
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus required />
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
            <CategorySelect
              categories={categories}
              value={form.categoryId}
              onChange={v => set('categoryId', v)}
            />
            <ConditionSelect value={condition} onChange={setCondition} />
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm">Product Images</h2>
            <p className="text-xs text-muted-foreground">Images are auto-cropped to 800×800px WebP</p>
            <div className="flex items-center gap-3">
              <input
                id="new-product-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagePick}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById('new-product-images')?.click()}
              >
                <ImagePlus className="w-4 h-4" /> Add Images
              </Button>
            </div>
            {croppedBlobs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{croppedBlobs.length} cropped image(s) ready</p>
                <div className="grid grid-cols-4 gap-2">
                  {croppedBlobs.map((item, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group">
                      <img
                        src={URL.createObjectURL(item.blob)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeCroppedImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
    </>
  )
}
