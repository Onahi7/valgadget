'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductVariant } from '@/lib/services/product.service'

type AttributeDraft = { key: string; value: string }

export type ProductVariantDraft = {
  clientId: string
  id?: string
  name: string
  sku: string
  price: string
  stock: string
  attributes: AttributeDraft[]
  isActive: boolean
}

type Props = {
  value: ProductVariantDraft[]
  onChange: (next: ProductVariantDraft[]) => void
  suggestedAttributes?: string[]
}

function createDraft(suggestedAttributes: string[] = []): ProductVariantDraft {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    sku: '',
    price: '',
    stock: '0',
    attributes: suggestedAttributes.map(key => ({ key, value: '' })),
    isActive: true,
  }
}

export function variantToDraft(variant: ProductVariant): ProductVariantDraft {
  return {
    clientId: variant.id || crypto.randomUUID(),
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: variant.price ? String(variant.price) : '',
    stock: String(variant.stock),
    attributes: Object.entries(variant.attributes ?? {}).map(([key, value]) => ({ key, value })),
    isActive: variant.isActive,
  }
}

export function serializeVariantDrafts(variants: ProductVariantDraft[]) {
  return variants.map(variant => ({
    id: variant.id,
    name: variant.name.trim(),
    sku: variant.sku.trim(),
    price: variant.price ? Number(variant.price) : undefined,
    stock: Number(variant.stock || 0),
    attributes: Object.fromEntries(
      variant.attributes
        .filter(attribute => attribute.key.trim() && attribute.value.trim())
        .map(attribute => [attribute.key.trim(), attribute.value.trim()]),
    ),
    isActive: variant.isActive,
  }))
}

export function VariantEditor({ value, onChange, suggestedAttributes = [] }: Props) {
  const updateVariant = (clientId: string, patch: Partial<ProductVariantDraft>) => {
    onChange(value.map(variant => variant.clientId === clientId ? { ...variant, ...patch } : variant))
  }

  const updateAttribute = (clientId: string, index: number, patch: Partial<AttributeDraft>) => {
    const variant = value.find(item => item.clientId === clientId)
    if (!variant) return
    updateVariant(clientId, {
      attributes: variant.attributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, ...patch } : attribute,
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>Variants</Label>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Use variants for storage, colour, network or bundle options. Variant stock replaces the product-level stock total.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => onChange([...value, createDraft(suggestedAttributes)])}>
          <Plus className="h-3.5 w-3.5" /> Add Variant
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No variants. The product will use its main price, SKU and stock.
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((variant, variantIndex) => (
            <div key={variant.clientId} className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Variant {variantIndex + 1}</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={event => updateVariant(variant.clientId, { isActive: event.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    Active
                  </label>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onChange(value.filter(item => item.clientId !== variant.clientId))} aria-label={`Remove variant ${variantIndex + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`variant-name-${variant.clientId}`}>Variant name *</Label>
                  <Input id={`variant-name-${variant.clientId}`} value={variant.name} onChange={event => updateVariant(variant.clientId, { name: event.target.value })} placeholder="128GB / Midnight" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`variant-sku-${variant.clientId}`}>Variant SKU *</Label>
                  <Input id={`variant-sku-${variant.clientId}`} value={variant.sku} onChange={event => updateVariant(variant.clientId, { sku: event.target.value })} placeholder="IPH13-128-MID" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`variant-price-${variant.clientId}`}>Price override</Label>
                  <Input id={`variant-price-${variant.clientId}`} type="number" min="0" step="0.01" value={variant.price} onChange={event => updateVariant(variant.clientId, { price: event.target.value })} placeholder="Uses main price" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`variant-stock-${variant.clientId}`}>Stock *</Label>
                  <Input id={`variant-stock-${variant.clientId}`} type="number" min="0" step="1" value={variant.stock} onChange={event => updateVariant(variant.clientId, { stock: event.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Attributes</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => updateVariant(variant.clientId, { attributes: [...variant.attributes, { key: '', value: '' }] })}>
                    <Plus className="h-3.5 w-3.5" /> Attribute
                  </Button>
                </div>
                {variant.attributes.map((attribute, attributeIndex) => (
                  <div key={attributeIndex} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-2">
                    <Input value={attribute.key} onChange={event => updateAttribute(variant.clientId, attributeIndex, { key: event.target.value })} placeholder="Storage" aria-label={`Variant ${variantIndex + 1} attribute name ${attributeIndex + 1}`} />
                    <Input value={attribute.value} onChange={event => updateAttribute(variant.clientId, attributeIndex, { value: event.target.value })} placeholder="128GB" aria-label={`Variant ${variantIndex + 1} attribute value ${attributeIndex + 1}`} />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => updateVariant(variant.clientId, { attributes: variant.attributes.filter((_, index) => index !== attributeIndex) })} aria-label={`Remove attribute ${attributeIndex + 1}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
