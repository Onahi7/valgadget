import dotenv from 'dotenv'
import { and, eq, inArray, or } from 'drizzle-orm'

dotenv.config({ path: '.env.local' })
dotenv.config()

import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'

type Spec = { label: string; value: string }

type LaptopSeed = {
  name: string
  slug: string
  sku: string
  brand: 'HP' | 'Dell' | 'Lenovo'
  price?: number
  existingSku?: string
  shortDescription: string
  specs: Spec[]
}

const commonSpecs = [
  { label: 'Condition', value: 'UK Used' },
  { label: 'Standard', value: 'US-standard keyboard/layout' },
]

const laptops: LaptopSeed[] = [
  {
    name: 'HP EliteBook 840 G6',
    slug: 'hp-elitebook-840-g6-uk-used',
    sku: 'LAP-HP-840G6-US',
    brand: 'HP',
    shortDescription: '8th Gen Core i5 business laptop with 8GB RAM, 256GB SSD, and touchscreen or non-touch options.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (8th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Full HD; touchscreen and non-touch options' },
      { label: 'Grade', value: 'Grade A+' },
    ],
  },
  {
    name: 'HP EliteBook 840 G8',
    slug: 'hp-elitebook-840-g8-uk-used',
    sku: 'LAP-HP-840G8-US',
    brand: 'HP',
    shortDescription: '11th Gen Core i5 business laptop with 8GB RAM, 256GB SSD, and touch or non-touch options.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (11th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Touchscreen and non-touch options' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
      { label: 'Grade', value: 'Grade A' },
    ],
  },
  {
    name: 'HP EliteBook 840 G7',
    slug: 'hp-elitebook-840-g7-uk-used',
    sku: 'LAP-HP-840G7-US',
    brand: 'HP',
    shortDescription: '10th Gen Core i5 business laptop with 8GB RAM, 256GB SSD, and touch or non-touch options.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (10th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Touchscreen and non-touch options' },
    ],
  },
  {
    name: 'Dell Latitude 9520',
    slug: 'dell-latitude-9520-uk-used',
    sku: 'LAP-DELL-9520-US',
    brand: 'Dell',
    shortDescription: '11th Gen Core i7 premium business laptop with 16GB RAM, 256GB SSD, and biometric security.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (11th Gen)' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
    ],
  },
  {
    name: 'HP ZBook Firefly G7',
    slug: 'hp-zbook-firefly-g7-uk-used',
    sku: 'LAP-HP-ZBFFG7-US',
    brand: 'HP',
    shortDescription: '10th Gen Core i5 mobile workstation with 8GB RAM, 256GB SSD, touchscreen, and facial recognition.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (10th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Touchscreen' },
      { label: 'Security', value: 'Facial recognition' },
      { label: 'Product Type', value: 'Mobile workstation' },
    ],
  },
  {
    name: 'Dell Latitude 5300 X360',
    slug: 'dell-latitude-5300-x360-uk-used',
    sku: 'LAP-DELL-5300X360-US',
    existingSku: 'D-2',
    brand: 'Dell',
    shortDescription: '8th Gen Core i5 convertible business laptop with 8GB RAM, 256GB SSD, and X360 touchscreen.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (8th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'X360 touchscreen' },
    ],
  },
  {
    name: 'Dell Latitude 7420',
    slug: 'dell-latitude-7420-uk-used',
    sku: 'LAP-DELL-7420-US',
    brand: 'Dell',
    shortDescription: '11th Gen Core i7 business laptop with 16GB RAM, 256GB SSD, facial recognition, and carbon-fiber body.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (11th Gen)' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Security', value: 'Facial recognition' },
      { label: 'Body', value: 'Carbon-fiber body' },
    ],
  },
  {
    name: 'Dell Latitude 7400 X360',
    slug: 'dell-latitude-7400-x360-uk-used',
    sku: 'LAP-DELL-7400X360-US',
    brand: 'Dell',
    shortDescription: '8th Gen Core i5 convertible laptop with 8GB RAM, 256GB SSD, X360 touchscreen, and metal body.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (8th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'X360 touchscreen' },
      { label: 'Body', value: 'Metal body' },
    ],
  },
  {
    name: 'HP ZBook Firefly G8',
    slug: 'hp-zbook-firefly-g8-uk-used',
    sku: 'LAP-HP-ZBFFG8-US',
    brand: 'HP',
    shortDescription: '11th Gen Core i7 mobile workstation with 16GB RAM, 256GB SSD, and biometric security.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (11th Gen), up to 3.0GHz stated stock specification' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
      { label: 'Product Type', value: 'Mobile workstation' },
    ],
  },
  {
    name: 'Lenovo ThinkPad X1 Yoga',
    slug: 'lenovo-thinkpad-x1-yoga-core-i7-13th-gen-uk-used',
    sku: 'LAP-LEN-X1Y-I7-13-US',
    brand: 'Lenovo',
    shortDescription: '13th Gen Core i7 convertible laptop with 32GB RAM, 512GB SSD, X360 touchscreen, and biometric security.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (13th Gen)' },
      { label: 'Memory', value: '32GB RAM' },
      { label: 'Storage', value: '512GB SSD' },
      { label: 'Display', value: 'X360 touchscreen' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
    ],
  },
  {
    name: 'HP EliteBook 1040 G7 X360',
    slug: 'hp-elitebook-1040-g7-x360-uk-used',
    sku: 'LAP-HP-1040G7X360-US',
    brand: 'HP',
    shortDescription: '10th Gen Core i7 convertible business laptop with 32GB RAM, 512GB SSD, and biometric security.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (10th Gen)' },
      { label: 'Memory', value: '32GB RAM' },
      { label: 'Storage', value: '512GB SSD' },
      { label: 'Display', value: 'X360 touchscreen' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
    ],
  },
  {
    name: 'HP ZBook Studio G8',
    slug: 'hp-zbook-studio-g8-rtx-3070-uk-used',
    sku: 'LAP-HP-ZBSTG8-RTX3070-US',
    brand: 'HP',
    price: 1_200_000,
    shortDescription: '11th Gen Core i7 mobile workstation with 32GB RAM, 512GB SSD, RTX 3070 graphics, and 4K touchscreen.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (11th Gen)' },
      { label: 'Memory', value: '32GB RAM' },
      { label: 'Storage', value: '512GB SSD' },
      { label: 'Graphics', value: 'NVIDIA GeForce RTX 3070, 8GB dedicated' },
      { label: 'Display', value: '4K touchscreen' },
      { label: 'Processor Configuration', value: '8 cores / 12 logical processors (supplier specification)' },
      { label: 'Product Type', value: 'Mobile workstation' },
    ],
  },
  {
    name: 'Dell XPS 13 Core i5 10th Gen',
    slug: 'dell-xps-13-core-i5-10th-gen-uk-used',
    sku: 'LAP-DELL-XPS13-I5-10-US',
    brand: 'Dell',
    shortDescription: '10th Gen Core i5 premium laptop with 16GB RAM, 256GB SSD, touchscreen, and biometric security.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (10th Gen)' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Touchscreen' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
    ],
  },
  {
    name: 'Dell XPS 13 Core i7 6th Gen 4K',
    slug: 'dell-xps-13-core-i7-6th-gen-4k-uk-used',
    sku: 'LAP-DELL-XPS13-I7-6-4K-US',
    brand: 'Dell',
    shortDescription: '6th Gen Core i7 premium laptop with 16GB RAM, 256GB SSD, and 4K touchscreen.',
    specs: [
      { label: 'Processor', value: 'Intel Core i7 (6th Gen)' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: '4K touchscreen' },
      { label: 'Battery', value: 'Excellent battery condition (supplier description)' },
    ],
  },
  {
    name: 'HP EliteBook 1030 G8 X360',
    slug: 'hp-elitebook-1030-g8-x360-uk-used',
    sku: 'LAP-HP-1030G8X360-US',
    brand: 'HP',
    shortDescription: '11th Gen Core i5 convertible business laptop with 16GB RAM, 256GB SSD, touchscreen, and fingerprint reader.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (11th Gen)' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'X360 touchscreen' },
      { label: 'Security', value: 'Fingerprint reader' },
    ],
  },
  {
    name: 'HP EliteBook 830 G7',
    slug: 'hp-elitebook-830-g7-uk-used',
    sku: 'LAP-HP-830G7-US',
    brand: 'HP',
    shortDescription: '10th Gen Core i5 business laptop with 8GB RAM, 256GB SSD, touchscreen, and Grade A+ condition.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (10th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Display', value: 'Touchscreen' },
      { label: 'Grade', value: 'Grade A+' },
    ],
  },
  {
    name: 'HP EliteBook 850 G8',
    slug: 'hp-elitebook-850-g8-uk-used',
    sku: 'LAP-HP-850G8-US',
    brand: 'HP',
    price: 450_000,
    shortDescription: '11th Gen Core i5 business laptop with 8GB RAM, 256GB SSD, biometric security, and Grade A condition.',
    specs: [
      { label: 'Processor', value: 'Intel Core i5 (11th Gen)' },
      { label: 'Memory', value: '8GB RAM' },
      { label: 'Storage', value: '256GB SSD' },
      { label: 'Security', value: 'Facial recognition / fingerprint reader' },
      { label: 'Grade', value: 'Grade A' },
    ],
  },
]

function descriptionFor(item: LaptopSeed) {
  return `${item.name} is a UK-used, US-standard laptop prepared for business, study, and everyday productivity. ${item.shortDescription} Exact cosmetic condition, available quantity, and included accessories should be confirmed before fulfilment.`
}

async function main() {
  const apply = process.argv.includes('--apply')
  const [category] = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(and(eq(categories.slug, 'laptops-uk-used'), eq(categories.isActive, true)))
    .limit(1)

  if (!category) throw new Error('Active category laptops-uk-used was not found.')

  const lookupSkus = laptops.flatMap(item => [item.sku, item.existingSku].filter(Boolean) as string[])
  const lookupSlugs = laptops.map(item => item.slug)
  const existing = await db
    .select()
    .from(products)
    .where(or(inArray(products.sku, lookupSkus), inArray(products.slug, lookupSlugs)))

  const existingBySku = new Map(existing.map(product => [product.sku, product]))
  const existingBySlug = new Map(existing.map(product => [product.slug, product]))
  const plan = laptops.map(item => {
    const found = (item.existingSku ? existingBySku.get(item.existingSku) : undefined)
      ?? existingBySku.get(item.sku)
      ?? existingBySlug.get(item.slug)
    return {
      action: found ? 'update' : 'insert',
      name: item.name,
      sku: found?.sku ?? item.sku,
      price: found ? Number(found.price) : (item.price ?? 0),
      active: found?.isActive ?? false,
      note: found
        ? 'Preserve existing price/images; refresh supplied stock details.'
        : item.price
          ? 'Inactive draft until product images and exact stock quantity are added.'
          : 'Inactive draft until price, product images, and exact stock quantity are added.',
    }
  })

  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', category, plan }, null, 2))
    return
  }

  let inserted = 0
  let updated = 0
  for (const item of laptops) {
    const found = (item.existingSku ? existingBySku.get(item.existingSku) : undefined)
      ?? existingBySku.get(item.sku)
      ?? existingBySlug.get(item.slug)
    const specs = [...commonSpecs, ...item.specs]
    const tags = ['laptop', 'uk-used', 'us-standard', item.brand.toLowerCase()]

    if (found) {
      await db
        .update(products)
        .set({
          name: item.name,
          description: descriptionFor(item),
          shortDescription: item.shortDescription,
          specs,
          categoryId: category.id,
          brand: item.brand,
          tags,
          condition: 'uk-used',
          stock: item.existingSku ? Math.max(found.stock, 1) : found.stock,
          isNew: true,
          updatedAt: new Date(),
        })
        .where(eq(products.id, found.id))
      updated += 1
      continue
    }

    await db.insert(products).values({
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      description: descriptionFor(item),
      shortDescription: item.shortDescription,
      specs,
      price: String(item.price ?? 0),
      images: [],
      categoryId: category.id,
      stock: 0,
      lowStockThreshold: 1,
      tags,
      condition: 'uk-used',
      featured: false,
      isNew: true,
      isActive: false,
      brand: item.brand,
    })
    inserted += 1
  }

  console.log(JSON.stringify({ mode: 'applied', category, inserted, updated, total: laptops.length }, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
