import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { User } from '@/lib/services/auth.service'
import { db } from '@/lib/server/mock-db'

const SESSION_COOKIE = 'vg_session'

function encodeToken(userId: string): string {
  return Buffer.from(`vg:${userId}`).toString('base64url')
}

function decodeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    if (!decoded.startsWith('vg:')) return null
    return decoded.slice(3)
  } catch {
    return null
  }
}

export function createSessionToken(userId: string): string {
  return encodeToken(userId)
}

export function readBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim()
}

export async function readSessionTokenFromCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const bearerToken = readBearerToken(request)
  const cookieToken = await readSessionTokenFromCookie()
  const token = bearerToken ?? cookieToken
  if (!token) return null

  const userId = decodeToken(token)
  if (!userId) return null

  return db.users.findById(userId)
}

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}
