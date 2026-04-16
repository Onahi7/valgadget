import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://valgadgets.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/shop',
    '/categories',
    '/raffles',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/legal/privacy',
    '/legal/terms',
    '/legal/returns',
    '/legal/cookies',
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/shop' ? 0.9 : 0.7,
  }))
}
