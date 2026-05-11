import dotenv from 'dotenv'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

dotenv.config({ path: '.env.local' })
dotenv.config()

neonConfig.webSocketConstructor = ws

type ProductRow = {
  id: string
  name: string
  sku: string
  category_slug: string
  short_description: string | null
  specs: Array<{ label: string; value: string }> | null
}

type VariantRow = {
  product_id: string
  variant_name: string
  attributes: Record<string, string> | null
}

type CopyPayload = {
  shortDescription: string
  description: string
  specs: Array<{ label: string; value: string }>
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Add it to .env.local before running this script.')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  try {
    const products = await loadProducts(pool)
    const variants = await loadVariants(pool)
    const variantsByProduct = groupVariants(variants)

    let updated = 0
    for (const product of products) {
      const payload = buildCopy(product, variantsByProduct.get(product.id) ?? [])
      await pool.query(
        `
          update products
          set short_description = $1,
              description = $2,
              specs = $3::json,
              updated_at = now()
          where id = $4
        `,
        [payload.shortDescription, payload.description, JSON.stringify(payload.specs), product.id]
      )
      updated += 1
      console.log(`Updated copy for ${product.sku} -> ${product.name}`)
    }

    console.log(`Catalog rewrite complete: ${updated} active products updated.`)
  } finally {
    await pool.end()
  }
}

async function loadProducts(pool: Pool): Promise<ProductRow[]> {
  const { rows } = await pool.query<ProductRow>(`
    select p.id, p.name, p.sku, c.slug as category_slug, p.short_description, p.specs
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active = true
    order by c.slug, p.name
  `)
  return rows
}

async function loadVariants(pool: Pool): Promise<VariantRow[]> {
  const { rows } = await pool.query<VariantRow>(`
    select v.product_id, v.name as variant_name, v.attributes
    from product_variants v
    join products p on p.id = v.product_id
    where p.is_active = true and v.is_active = true
    order by v.product_id, v.sort_order, v.name
  `)
  return rows
}

function groupVariants(rows: VariantRow[]): Map<string, VariantRow[]> {
  const map = new Map<string, VariantRow[]>()
  for (const row of rows) {
    const list = map.get(row.product_id) ?? []
    list.push(row)
    map.set(row.product_id, list)
  }
  return map
}

function buildCopy(product: ProductRow, variants: VariantRow[]): CopyPayload {
  switch (product.category_slug) {
    case 'android-phones-tablets':
      return buildAndroidCopy(product, variants)
    case 'iphones-uk-used':
      return buildIphoneCopy(product, variants)
    case 'speakers':
      return buildSpeakerCopy(product)
    case 'smartwatches':
      return buildWatchCopy(product)
    case 'rechargeable-fans':
      return buildFanCopy(product)
    case 'monitors':
      return buildMonitorCopy(product)
    default:
      return {
        shortDescription: product.short_description ?? `${product.name} available in our gadget catalog.`,
        description: `${product.name} is available for customers looking for reliable everyday use and good value.`,
        specs: product.specs ?? [],
      }
  }
}

function buildAndroidCopy(product: ProductRow, variants: VariantRow[]): CopyPayload {
  const isTablet = /\bpad\b/i.test(product.name)
  const memoryOptions = variants
    .map((variant) => variant.attributes?.memory ?? variant.variant_name)
    .filter(Boolean)
  const parsed = memoryOptions.map(parseMemoryOption).filter(Boolean) as Array<{ ram: string; storage: string }>
  const ramOptions = sortGbValues(unique(parsed.map((item) => item.ram)))
  const storageOptions = sortGbValues(unique(parsed.map((item) => item.storage)))
  const connectivity = /\b5g\b/i.test(product.name) ? '5G' : /\b4g\b/i.test(product.name) ? '4G' : 'Wi-Fi / standard network support'
  const deviceType = isTablet ? 'tablet' : 'smartphone'
  const shortDescription = `${capitalize(deviceType)} with ${ramOptions.join(', ')} RAM and ${storageOptions.join(', ')} storage options.`
  const description = `${product.name} is a ${deviceType} built for daily use, entertainment, work, and communication. It is available in ${ramOptions.join(', ')} RAM and ${storageOptions.join(', ')} storage variants, giving buyers flexible memory and storage options for apps, media, and everyday performance.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Device Type', isTablet ? 'Tablet' : 'Smartphone'),
      spec('Connectivity', connectivity),
      spec('Available RAM', ramOptions.join(', ')),
      spec('Available Storage', storageOptions.join(', ')),
      spec('Variants', memoryOptions.join(', ')),
    ], product.specs ?? []),
  }
}

function buildIphoneCopy(product: ProductRow, variants: VariantRow[]): CopyPayload {
  const storageOptions = sortGbValues(unique(
    variants
      .map((variant) => variant.attributes?.storage ?? extractStorage(variant.variant_name))
      .filter(Boolean) as string[]
  ))
  const simOptions = unique(
    variants
      .map((variant) => variant.attributes?.sim)
      .filter(Boolean) as string[]
  )
  const isNewNonActive = new Set(['IPH16', 'IPH16PLUS']).has(product.sku)
  const condition = isNewNonActive ? 'Brand New Non-Active' : 'UK Used'
  const sentenceCondition = isNewNonActive ? 'brand new non-active' : 'UK used'
  const shortDescription = `${condition} iPhone with ${storageOptions.join(', ')} storage${simOptions.length ? ` and ${simOptions.join(', ')} support` : ''}.`
  const description = `${product.name} is available as a ${sentenceCondition} device for buyers who want Apple performance, quality cameras, and everyday reliability. It comes in ${storageOptions.join(', ')} storage options${simOptions.length ? ` with ${simOptions.join(', ')} support` : ''}, making it suitable for work, media, and daily communication.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Condition', condition),
      spec('Available Storage', storageOptions.join(', ')),
      spec('SIM Options', simOptions.join(', ')),
      spec('Variants', variants.map((variant) => variant.variant_name).join(', ')),
    ], product.specs ?? []),
  }
}

function buildSpeakerCopy(product: ProductRow): CopyPayload {
  const brand = product.name.split(' ')[0] === 'Harman' ? 'Harman Kardon' : product.name.split(' ').slice(0, 1).join(' ')
  const model = product.name.replace(/^Harman Kardon\s+/i, '').replace(/^(JBL|Zealot|Soundcore)\s+/i, '')
  const hasWifi = /\bwi-fi\b/i.test(product.name)
  const shortDescription = `${product.name} portable speaker for music, indoor listening, and outdoor entertainment.`
  const description = `${product.name} is a portable speaker designed for clear sound, easy wireless listening, and everyday entertainment. It is suitable for home use, small gatherings, travel, and outdoor use, with a practical design that makes it easy to move around and connect to your devices.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Brand', brand),
      spec('Model', model),
      spec('Product Type', 'Portable Speaker'),
      spec('Connectivity', hasWifi ? 'Bluetooth / Wi-Fi' : 'Bluetooth Wireless'),
    ], product.specs ?? []),
  }
}

function buildWatchCopy(product: ProductRow): CopyPayload {
  const size = extractMm(product.name)
  const connectivity = /cellular/i.test(product.name) ? 'GPS + Cellular' : /\bgps\b/i.test(product.name) ? 'GPS' : 'Smartwatch Connectivity'
  const condition = /brand new/i.test(product.name) ? 'Brand New Sealed' : /\(UK\)/i.test(product.name) ? 'UK Used' : 'Available Stock'
  const shortDescription = `${size ? `${size} ` : ''}smartwatch with ${connectivity} support and everyday health and fitness features.`
  const description = `${product.name} is a smartwatch built for calls, notifications, fitness tracking, and daily convenience. It is a practical option for users who want wearable access to communication, workouts, and day-to-day health features in a compact wrist device.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Brand', 'Apple'),
      spec('Case Size', size),
      spec('Connectivity', connectivity),
      spec('Condition', condition),
    ], product.specs ?? []),
  }
}

function buildFanCopy(product: ProductRow): CopyPayload {
  const size = extractInch(product.name)
  const fanType =
    /mist/i.test(product.name) ? 'Rechargeable Mist Fan'
      : /panel/i.test(product.name) ? 'Solar Fan Panel'
      : /solar/i.test(product.name) ? 'Rechargeable Solar Fan'
      : 'Rechargeable Fan'
  const shortDescription = `${size ? `${size} ` : ''}${fanType} for home, office, and backup cooling use.`
  const description = `${product.name} is designed for reliable cooling during daily use and power interruptions. It is suitable for home, office, and shop environments, with a practical rechargeable or solar-based setup depending on the model.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Product Type', fanType),
      spec('Size', size),
      spec('Power Source', /solar/i.test(product.name) || /panel/i.test(product.name) ? 'Solar / Rechargeable' : 'Rechargeable'),
    ], product.specs ?? []),
  }
}

function buildMonitorCopy(product: ProductRow): CopyPayload {
  const shortDescription = '27-inch Full HD IPS monitor with a slim-bezel design for work and home setups.'
  const description = `${product.name} is designed for work, study, browsing, and everyday entertainment. It offers a large screen, Full HD display quality, and a slim-bezel design that fits neatly into modern office and home desk setups.`

  return {
    shortDescription,
    description,
    specs: compactSpecs([
      spec('Display Size', '27-inch'),
      spec('Resolution', '1920 x 1080 (Full HD)'),
      spec('Panel Type', 'IPS'),
      spec('Design', 'Slim bezel'),
    ], product.specs ?? []),
  }
}

function parseMemoryOption(value: string): { ram: string; storage: string } | null {
  const match = value.match(/(\d+)\+(\d+)/)
  if (!match) return null
  return { ram: `${match[1]}GB`, storage: `${match[2]}GB` }
}

function extractStorage(value: string): string | null {
  return value.match(/\b(64GB|128GB|256GB|512GB)\b/i)?.[1]?.toUpperCase() ?? null
}

function extractMm(value: string): string | null {
  return value.match(/\b(\d{2})mm\b/i)?.[0] ?? null
}

function extractInch(value: string): string | null {
  return value.match(/\b(\d{1,2})(?:-inch| inch)\b/i)?.[0]?.replace(/-/g, ' ') ?? null
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function spec(label: string, value: string | null): { label: string; value: string } | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed ? { label, value: trimmed } : null
}

function compactSpecs(primary: Array<{ label: string; value: string } | null>, existing: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  const map = new Map<string, string>()
  for (const item of primary) {
    if (item) map.set(item.label, item.value)
  }
  for (const item of existing) {
    if (!map.has(item.label) && item.value?.trim()) {
      map.set(item.label, item.value.trim())
    }
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
}

function sortGbValues(values: string[]): string[] {
  return [...values].sort((a, b) => numericPrefix(a) - numericPrefix(b))
}

function numericPrefix(value: string): number {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
