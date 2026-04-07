/**
 * ImageKit server helper — ValGadget
 * Server-only. Never import in client components.
 */
import ImageKit from '@imagekit/nodejs'

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
const publicKey  = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

let _ik: InstanceType<typeof ImageKit> | null = null

function getIK(): InstanceType<typeof ImageKit> {
  if (!_ik) {
    if (!privateKey || !publicKey || !urlEndpoint) {
      throw new Error(
        'ImageKit env vars missing. Set IMAGEKIT_PRIVATE_KEY, ' +
        'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT.'
      )
    }
    _ik = new ImageKit({ privateKey, publicKey, urlEndpoint })
  }
  return _ik
}

/** Generate a short-lived upload authentication signature for the browser SDK */
export function getUploadAuth(token?: string, expire?: number) {
  return getIK().getAuthenticationParameters(token, expire)
}

/**
 * Upload a file buffer/stream directly from the server.
 * Returns the ImageKit file URL and fileId.
 */
export async function uploadFile(
  file: Buffer | string,
  fileName: string,
  folder = '/valgadget'
): Promise<{ url: string; fileId: string }> {
  const result = await getIK().upload({
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
  await getIK().deleteFile(fileId)
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

  const path = url.replace(urlEndpoint, '')
  const ik = getIK()

  return ik.url({
    src: url,
    transformation: [{
      width:   params.width?.toString(),
      height:  params.height?.toString(),
      quality: params.quality?.toString(),
      format:  params.format ?? 'auto',
    }],
  })
}
