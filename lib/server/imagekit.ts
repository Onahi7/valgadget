/**
 * ImageKit server helper — ValGadget
 * Server-only. Never import in client components.
 */
import ImageKit from '@imagekit/nodejs'

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _ik: any = null

function getIK() {
  if (!_ik) {
    if (!privateKey) {
      throw new Error('ImageKit env var missing. Set IMAGEKIT_PRIVATE_KEY.')
    }
    _ik = new ImageKit({ privateKey })
  }
  return _ik
}

/** Generate a short-lived upload authentication signature for the browser SDK */
export function getUploadAuth(token?: string, expire?: number) {
  return getIK().helper.getAuthenticationParameters(token, expire)
}

/**
 * Upload a file buffer/stream directly from the server.
 * Returns the ImageKit file URL and fileId.
 */
export async function uploadFile(
  file: string,
  fileName: string,
  folder = '/valgadget'
): Promise<{ url: string; fileId: string }> {
  const result = await getIK().files.upload({
    file,
    fileName,
    folder,
    useUniqueFileName: true,
    tags: ['valgadget'],
  })
  return { url: result.url, fileId: result.fileId }
}

/** Delete a file from ImageKit by its fileId */
export async function deleteFile(fileId: string): Promise<void> {
  await getIK().files.delete(fileId)
}

/**
 * Build a responsive transformed URL from an ImageKit base URL.
 * e.g. transformUrl(url, { width: 400, height: 400, quality: 80 })
 */
export function transformUrl(
  url: string,
  params: { width?: number; height?: number; quality?: number; format?: string }
): string {
  if (!urlEndpoint || !url.includes(urlEndpoint)) return url

  const tr: string[] = []
  if (params.width) tr.push(`w-${params.width}`)
  if (params.height) tr.push(`h-${params.height}`)
  if (params.quality) tr.push(`q-${params.quality}`)
  tr.push(`f-${params.format ?? 'auto'}`)

  const separator = urlEndpoint.endsWith('/') ? '' : '/'
  return `${urlEndpoint}${separator}tr:${tr.join(',')}${url.replace(urlEndpoint, '')}`
}
