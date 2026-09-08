/** Shared policy for images saved in the catalog, including custom ImageKit domains. */
export function isCatalogImage(src?: string | null): boolean {
  if (!src) return false
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return false
    if (url.hostname === 'ik.imagekit.io') return true
    const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    return Boolean(endpoint && url.origin === new URL(endpoint).origin)
  } catch {
    return false
  }
}
