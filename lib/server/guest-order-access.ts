import crypto from 'node:crypto'

function getSecret() {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required for guest order access.')
  return secret ?? 'dev-secret-change-me'
}

export function createGuestOrderAccessToken(orderId: string, email: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${orderId}:${email.trim().toLowerCase()}`)
    .digest('hex')
}

export function verifyGuestOrderAccessToken(orderId: string, email: string, token: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false
  const expected = createGuestOrderAccessToken(orderId, email)
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
}
