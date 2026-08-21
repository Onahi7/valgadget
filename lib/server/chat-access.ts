import crypto from 'node:crypto'

function secret() {
  return process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me'
}

export function createGuestChatToken(sessionId: string, email: string): string {
  return crypto.createHmac('sha256', secret()).update(`${sessionId}:${email.trim().toLowerCase()}`).digest('hex')
}

export function verifyGuestChatToken(sessionId: string, email: string, token: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false
  const expected = createGuestChatToken(sessionId, email)
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
}
