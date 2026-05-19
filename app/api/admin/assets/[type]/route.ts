import { NextRequest } from 'next/server'
import { requireAuth, apiOk, apiError } from '@/lib/server/auth-helpers'
import { uploadFile } from '@/lib/server/imagekit'

export async function POST(req: NextRequest, context: { params: Promise<{ type: string }> }) {
  const auth = await requireAuth(req, ['admin'])
  if ('status' in auth) return auth

  const { type } = await context.params
  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return apiError('file is required', 400)
  }

  if (!file.type.startsWith('image/')) {
    return apiError(`Unsupported file type: ${file.type || 'unknown'}`, 400)
  }

  if (file.size > 5 * 1024 * 1024) {
    return apiError('File too large. Max 5MB.', 400)
  }

  const arrayBuffer = await (file as File).arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = (file as File).type || 'application/octet-stream'
  const fileName = (file as File).name || `${type}-${Date.now()}`
  const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`

  try {
    const { url } = await uploadFile(base64, fileName, `/valgadget/${type}`)
    return apiOk({ url })
  } catch (err) {
    console.error('[admin/assets upload]', err)
    return apiError('Failed to upload asset', 500)
  }
}
