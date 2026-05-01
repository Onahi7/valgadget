import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

const base = 'http://localhost:3000'

async function hit(path: string) {
  const r = await fetch(base + path)
  const j = await r.json()
  return { status: r.status, body: j }
}

async function main() {
  console.log('NOTE: this check needs dev server running on :3000')
  const bySlug = await hit('/api/products?category=power-charging&limit=100')
  const cats = await hit('/api/categories/flat')
  console.log(JSON.stringify({ bySlugStatus: bySlug.status, bySlugCount: bySlug.body?.data?.length ?? bySlug.body?.length, first: bySlug.body?.data?.[0]?.name ?? null, categoriesCount: cats.body?.data?.length ?? cats.body?.length }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
