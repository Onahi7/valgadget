import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import crypto from 'crypto'

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_RAW && process.env.NODE_ENV === 'production') {
  throw new Error('[proxy] JWT_SECRET is required in production.')
}
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW ?? 'dev-secret-change-me')

// Page routes that require authentication
const PROTECTED_PATHS = ['/account', '/admin', '/affiliate']

// Routes that should redirect to home if already authenticated
const AUTH_PATHS = ['/login', '/register', '/admin/login']

// Admin-only routes (pages and API)
const ADMIN_PATHS = ['/admin', '/api/admin']

// Public API paths that never require auth
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/refresh',
  '/api/products',
  '/api/products/featured',
  '/api/products/new-arrivals',
  '/api/products/slug',
  '/api/categories',
  '/api/reviews',
  '/api/raffles',
  '/api/shipping-rates',
  '/api/payments/webhook',
  '/api/payments/paystack',
  '/api/payments',
  '/api/contact',
  '/api/newsletter',
  '/api/coupons/validate',
]

// Body size limits per route pattern (in bytes)
const BODY_SIZE_LIMITS: Record<string, number> = {
  '/api/products': 1024 * 1024,        // 1MB for product creation
  '/api/admin/products': 1024 * 1024,   // 1MB for product updates
  '/api/admin/assets': 5 * 1024 * 1024, // 5MB for asset uploads
  '/api/contact': 50 * 1024,            // 50KB for contact form
  '/api/orders': 256 * 1024,            // 256KB for orders
}
const DEFAULT_BODY_SIZE_LIMIT = 256 * 1024 // 256KB default

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function getBodySizeLimit(pathname: string): number {
  for (const [pattern, limit] of Object.entries(BODY_SIZE_LIMITS)) {
    if (pathname.startsWith(pattern)) return limit
  }
  return DEFAULT_BODY_SIZE_LIMIT
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
}

async function verifyToken(token: string) {
  try {
    const normalizedToken = token.includes('%') ? decodeURIComponent(token) : token
    const { payload } = await jwtVerify(normalizedToken, SECRET, { algorithms: ['HS256'] })
    return payload as { sub: string; email: string; role: string; name: string }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Get token from cookie (preferred) or Authorization header
  const cookieToken = request.cookies.get('vg_token')?.value
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = cookieToken || headerToken

  // Verify token if present
  const user = token ? await verifyToken(token) : null

  // Check if route is protected
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isApiPath = pathname.startsWith('/api/')

  // CSRF protection for state-changing API requests
  if (isApiPath && !isPublicApiPath(pathname)) {
    const method = request.method
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      // Require custom header for all non-GET/HEAD API requests (prevents CSRF)
      const hasCustomHeader = request.headers.get('x-requested-with') === 'XMLHttpRequest' ||
                              request.headers.get('authorization')?.startsWith('Bearer ')
      if (!hasCustomHeader) {
        return NextResponse.json(
          { message: 'Missing required headers. Please refresh and try again.' },
          { status: 403 }
        )
      }
    }
  }

  // Request body size check (content-length based, lightweight)
  if (isApiPath && request.method !== 'GET' && request.method !== 'HEAD') {
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const maxSize = getBodySizeLimit(pathname)
      if (parseInt(contentLength, 10) > maxSize) {
        return NextResponse.json(
          { message: `Request body too large. Maximum size: ${Math.round(maxSize / 1024)}KB` },
          { status: 413 }
        )
      }
    }
  }

  // API route protection
  if (isApiPath) {
    // Allow public API paths
    if (isPublicApiPath(pathname)) {
      const res = NextResponse.next()
      // Set CSRF cookie for forms if not present
      if (!request.cookies.get('vg_csrf')) {
        const csrfToken = crypto.randomBytes(32).toString('hex')
        res.cookies.set('vg_csrf', csrfToken, {
          httpOnly: false, // Client needs to read this
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })
      }
      return res
    }

    // All other API routes require authentication
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    // Admin API routes require admin role
    if (isAdminPath && user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. Insufficient permissions.' }, { status: 403 })
    }

    return NextResponse.next()
  }

  // Admin login page — handle before protected/admin path checks
  if (pathname === '/admin/login') {
    // Already authenticated as admin → redirect to admin dashboard
    if (user?.role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    // Allow access (unauthenticated or non-admin users can see the form)
    return NextResponse.next()
  }

  // Page route protection
  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('returnUrl', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  // Redirect to home if accessing auth routes while authenticated
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check admin access for pages
  if (isAdminPath && user?.role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
