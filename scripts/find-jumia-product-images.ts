import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'
import { desc, eq } from 'drizzle-orm'

type Candidate = {
  title: string
  href: string
  image: string
  score: number
  detailImages: string[]
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function clean(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function tokens(value: string) {
  return clean(value)
    .split(/\s+/)
    .filter(token => token.length > 1)
    .filter(token => !['portable', 'wireless', 'bluetooth', 'speaker', 'speakers', 'rechargeable', 'black', 'new'].includes(token))
}

function scoreMatch(productName: string, candidateTitle: string) {
  const productTokens = tokens(productName)
  const candidate = clean(candidateTitle)
  if (productTokens.length === 0) return 0
  return productTokens.reduce((score, token) => score + (candidate.includes(token) ? 1 : 0), 0) / productTokens.length
}

function isWrongAccessory(productName: string, candidateTitle: string) {
  const product = clean(productName)
  const candidate = clean(candidateTitle)
  const accessoryWords = ['bag', 'case', 'cover', 'pouch', 'protector', 'stand holder']
  if (accessoryWords.some(word => product.includes(word))) return false
  return accessoryWords.some(word => candidate.includes(word))
}

function isPlaceholder(url: string) {
  return url.includes('source.unsplash.com') || url.includes('images.unsplash.com')
}

function normalizeJumiaImage(url: string) {
  return url
    .replace(/fit-in\/(?:150|300|500)x(?:150|300|500)/, 'fit-in/680x680')
    .replace(/\?.*$/, '')
}

function parseCards(html: string, productName: string) {
  return html
    .split('<article ')
    .slice(1)
    .map(chunk => `<article ${chunk.split('</article>')[0]}</article>`)
    .map(card => {
      const href = card.match(/<a href="([^"]+\.html)" class="core"/)?.[1]
      const title = decodeHtml(
        card.match(/<h3 class="name">([^<]+)<\/h3>/)?.[1]
        ?? card.match(/data-ga4-item_name="([^"]+)"/)?.[1]
        ?? '',
      )
      const image = decodeHtml(
        card.match(/data-src="([^"]*ng\.jumia\.is[^"]+)"/)?.[1]
        ?? card.match(/data-moengage-product_image="([^"]+)"/)?.[1]
        ?? '',
      )

      if (!href || !title || !image || isWrongAccessory(productName, title)) return null

      return {
        title,
        href: href.startsWith('http') ? href : `https://www.jumia.com.ng${href}`,
        image: normalizeJumiaImage(image),
        score: scoreMatch(productName, title),
      }
    })
    .filter((card): card is Omit<Candidate, 'detailImages'> => Boolean(card))
    .sort((a, b) => b.score - a.score)
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.text()
}

async function getDetailImages(url: string) {
  const html = await fetchText(url)
  const matches = html.match(/https:\/\/ng\.jumia\.is\/unsafe\/fit-in\/(?:680|500|300)x(?:680|500|300)\/filters:fill\(white\)\/product\/[^"'<> ]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<> ]*)?/gi) ?? []
  return [...new Set(matches.map(normalizeJumiaImage))]
    .filter(url => !url.includes('/cms/'))
    .slice(0, 5)
}

async function searchJumia(productName: string) {
  const searchUrl = `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(productName)}`
  const html = await fetchText(searchUrl)
  const candidates: Candidate[] = []

  for (const card of parseCards(html, productName).slice(0, 3)) {
    let detailImages: string[] = []
    try {
      detailImages = await getDetailImages(card.href)
    } catch {
      detailImages = [card.image]
    }
    candidates.push({ ...card, detailImages: detailImages.length ? detailImages : [card.image] })
  }

  return candidates
}

async function main() {
  const apply = process.argv.includes('--apply')
  const minScoreArg = process.argv.find(arg => arg.startsWith('--min-score='))
  const minScore = minScoreArg ? Number(minScoreArg.split('=')[1]) : 0.75

  const rows = await db.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    images: products.images,
    category: categories.name,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))

  const needsImages = rows.filter(product => {
    const imageList = product.images ?? []
    return imageList.length === 0 || imageList.some(isPlaceholder)
  })

  const results = []

  for (const product of needsImages) {
    const candidates = await searchJumia(product.name)
    const best = candidates[0]
    const accepted = Boolean(best && best.score >= minScore && best.detailImages.length)

    if (apply && accepted) {
      await db.update(products)
        .set({ images: best!.detailImages, updatedAt: new Date() })
        .where(eq(products.id, product.id))
    }

    results.push({
      name: product.name,
      sku: product.sku,
      category: product.category,
      accepted,
      best: best ? {
        title: best.title,
        score: Number(best.score.toFixed(2)),
        href: best.href,
        images: best.detailImages,
      } : null,
      candidates: candidates.map(candidate => ({
        title: candidate.title,
        score: Number(candidate.score.toFixed(2)),
        href: candidate.href,
      })),
    })

    await new Promise(resolve => setTimeout(resolve, 250))
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    minScore,
    checked: needsImages.length,
    accepted: results.filter(result => result.accepted).length,
    results,
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
