import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_RAW && process.env.NODE_ENV === 'production') {
  throw new Error('[proxy] JWT_SECRET is required in production.')
}
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW ?? 'dev-secret-change-me')

// Page routes that require authentication
const PROTECTED_PATHS = ['/account', '/admin', '/affiliate']

// Routes that should redirect to home if already authenticated
const AUTH_PATHS = ['/login', '/register']

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

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
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

  // API route protection
  if (isApiPath) {
    // Allow public API paths
    if (isPublicApiPath(pathname)) {
      return NextResponse.next()
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
