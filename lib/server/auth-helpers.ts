/**
 * Server-only auth helpers: JWT sign/verify, password hash/compare, middleware.
 * Uses jose (Web Crypto) — compatible with Next.js Edge & Node runtimes.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// ─── Config ────────────────────────────────────────────────────────────────

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_RAW) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth] JWT_SECRET is required in production. Set it in your environment variables.')
  }
  console.warn('[auth] JWT_SECRET is not set — using insecure dev default.')
}
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW ?? 'dev-secret-change-me')
const ALGORITHM = 'HS256'
const TOKEN_TTL = '7d'

// ─── JWT ───────────────────────────────────────────────────────────────────

export interface TokenPayload extends JWTPayload {
  sub: string        // user id
  email: string
  role: string
  name: string
}

export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] })
  return payload as TokenPayload
}

// ─── Password ──────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ─── Request helpers ───────────────────────────────────────────────────────

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? ''
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return null
}

export async function getRequestUser(req: NextRequest): Promise<TokenPayload | null> {
  const token = getBearerToken(req)
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── Route auth guard ──────────────────────────────────────────────────────

type Role = 'customer' | 'affiliate' | 'admin'

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Role[]
): Promise<{ user: TokenPayload } | NextResponse> {
  const user = await getRequestUser(req)

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 })
  }

  if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
    return NextResponse.json({ message: 'Forbidden. Insufficient permissions.' }, { status: 403 })
  }

  return { user }
}

// ─── Response helpers ──────────────────────────────────────────────────────

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status = 400, errors?: Record<string, string[]>): NextResponse {
  return NextResponse.json({ message, ...(errors ? { errors } : {}) }, { status })
}

export function apiRateLimited(resetAt: number): NextResponse {
  const response = NextResponse.json(
    { message: 'Too many requests. Please try again later.' },
    { status: 429 }
  )
  response.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)))
  response.headers.set('X-RateLimit-Reset', String(resetAt))
  return response
}

// ─── Reference generator ───────────────────────────────────────────────────

export function generateReference(prefix = 'VG'): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}
