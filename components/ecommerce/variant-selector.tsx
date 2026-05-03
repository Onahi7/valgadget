'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price?: number
  stock: number
  attributes: Record<string, string>
  image?: string
  isActive: boolean
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
  basePrice: number
}

export function VariantSelector({ variants, selectedVariant, onSelect, basePrice }: VariantSelectorProps) {
  // Extract unique attribute types (e.g., color, size)
  const attributeTypes = Array.from(
    new Set(variants.flatMap(v => Object.keys(v.attributes)))
  )

  // Get unique values for each attribute type
  const attributeOptions = attributeTypes.reduce((acc, type) => {
    acc[type] = Array.from(new Set(variants.map(v => v.attributes[type]).filter(Boolean)))
    return acc
  }, {} as Record<string, string[]>)

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  // Find matching variant based on selected attributes
  const findMatchingVariant = (attrs: Record<string, string>) => {
    return variants.find(v => {
      return Object.entries(attrs).every(([key, value]) => v.attributes[key] === value)
    })
  }

  const handleAttributeSelect = (type: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [type]: value }
    setSelectedAttributes(newAttributes)

    // Check if we have a complete selection
    if (Object.keys(newAttributes).length === attributeTypes.length) {
      const variant = findMatchingVariant(newAttributes)
      if (variant) {
        onSelect(variant)
      }
    }
  }

  // Check if a specific option is available given current selections
  const isOptionAvailable = (type: string, value: string) => {
    const testAttributes = { ...selectedAttributes, [type]: value }
    return variants.some(v => {
      return Object.entries(testAttributes).every(([key, val]) => v.attributes[key] === val) && v.stock > 0
    })
  }

  if (variants.length === 0) return null

  return (
    <div className="space-y-6">
      {attributeTypes.map(type => (
        <div key={type}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold capitalize">
              {type}
              {selectedAttributes[type] && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {selectedAttributes[type]}
                </span>
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {attributeOptions[type].map(value => {
              const isSelected = selectedAttributes[type] === value
              const isAvailable = isOptionAvailable(type, value)
              const isColor = type.toLowerCase() === 'color'

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => isAvailable && handleAttributeSelect(type, value)}
                  disabled={!isAvailable}
                  className={cn(
                    'relative px-4 py-2 border-2 rounded-lg font-medium text-sm transition-all',
                    isSelected && 'border-primary bg-primary/10 text-primary',
                    !isSelected && isAvailable && 'border-border hover:border-primary/50 hover:bg-accent',
                    !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                  )}
                >
                  {isColor && (
                    <span
                      className="inline-block w-4 h-4 rounded-full border mr-2 align-middle"
                      style={{ backgroundColor: value.toLowerCase() }}
                    />
                  )}
                  {value}
                  {isSelected && (
                    <Check className="inline-block w-4 h-4 ml-2 align-middle" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Variant Info */}
      {selectedVariant && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Variant</span>
            {selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                Only {selectedVariant.stock} left!
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">SKU: {selectedVariant.sku}</span>
            {selectedVariant.price && selectedVariant.price !== basePrice && (
              <span className="text-lg font-bold text-primary">
                ₦{selectedVariant.price.toLocaleString()}
              </span>
            )}
          </div>
          {selectedVariant.stock === 0 && (
            <p className="text-sm text-destructive font-medium">Out of stock</p>
          )}
        </div>
      )}
    </div>
  )
}
