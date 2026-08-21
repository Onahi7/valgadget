import { z } from 'zod'

export const PRODUCT_CONDITIONS = [
  'brand-new',
  'uk-used',
  'us-used',
  'naija-used',
  'refurbished',
  'open-box',
] as const

export type ProductCondition = typeof PRODUCT_CONDITIONS[number]

export function normalizeProductCondition(value: string | null | undefined): ProductCondition {
  return PRODUCT_CONDITIONS.includes(value as ProductCondition)
    ? value as ProductCondition
    : 'brand-new'
}

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable()
const requiredCategoryId = z.string().trim().min(1, 'Select a category.').max(100)

const specsSchema = z.array(z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(500),
})).max(50).default([]).transform(specs => {
  const labels = new Set<string>()
  return specs.filter(spec => {
    const key = spec.label.toLowerCase()
    if (labels.has(key)) return false
    labels.add(key)
    return true
  })
})

export const adminVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(100),
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.string().trim().max(50), z.string().trim().max(120)).default({}),
  image: optionalText(2000),
  isActive: z.boolean().default(true),
})

const commonProductFields = {
  description: z.string().trim().max(20000).default(''),
  shortDescription: optionalText(500),
  specs: specsSchema,
  comparePrice: z.number().positive().optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  categoryId: optionalText(100),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).max(100000).default(5),
  barcode: optionalText(100),
  brand: optionalText(100),
  tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  condition: z.enum(PRODUCT_CONDITIONS).default('brand-new'),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.string().trim().min(1).max(2000)).max(20).default([]),
  variants: z.array(adminVariantSchema).max(100).default([]),
}

export const createAdminProductSchema = z.object({
  name: z.string().trim().min(2).max(300),
  sku: z.string().trim().min(1).max(100),
  price: z.number().positive(),
  ...commonProductFields,
  categoryId: requiredCategoryId,
}).superRefine((value, ctx) => validateProductRelationships(value, ctx))

export const updateAdminProductSchema = z.object({
  name: z.string().trim().min(2).max(300).optional(),
  sku: z.string().trim().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  description: commonProductFields.description.optional(),
  shortDescription: commonProductFields.shortDescription,
  specs: specsSchema.optional(),
  comparePrice: commonProductFields.comparePrice,
  cost: commonProductFields.cost,
  categoryId: requiredCategoryId.optional(),
  stock: commonProductFields.stock.optional(),
  lowStockThreshold: commonProductFields.lowStockThreshold.optional(),
  barcode: commonProductFields.barcode,
  brand: commonProductFields.brand,
  tags: commonProductFields.tags.optional(),
  condition: commonProductFields.condition.optional(),
  featured: commonProductFields.featured.optional(),
  isNew: commonProductFields.isNew.optional(),
  isActive: commonProductFields.isActive.optional(),
  images: commonProductFields.images.optional(),
  variants: commonProductFields.variants.optional(),
}).superRefine((value, ctx) => validateProductRelationships(value, ctx))

function validateProductRelationships(
  value: { sku?: string; price?: number; comparePrice?: number | null; variants?: Array<{ sku: string }> },
  ctx: z.RefinementCtx,
) {
  if (value.price && value.comparePrice && value.comparePrice < value.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['comparePrice'], message: 'Compare price must be at least the selling price.' })
  }

  const skus = new Set<string>()
  if (value.sku) skus.add(value.sku.toLowerCase())
  for (const [index, variant] of (value.variants ?? []).entries()) {
    const sku = variant.sku.toLowerCase()
    if (skus.has(sku)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variants', index, 'sku'], message: 'Every product and variant SKU must be unique.' })
    }
    skus.add(sku)
  }
}

export function validationErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    errors[key] = [...(errors[key] ?? []), issue.message]
  }
  return errors
}

export function nullableValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

export function slugifyProductName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function withConditionTag(tags: string[], condition: typeof PRODUCT_CONDITIONS[number]) {
  const conditionValues = new Set<string>(PRODUCT_CONDITIONS)
  const next = tags.filter(tag => !conditionValues.has(tag))
  return condition === 'brand-new' ? next : [...next, condition]
}

export function postgresErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('cause' in error) return postgresErrorCode(error.cause)
  return undefined
}
