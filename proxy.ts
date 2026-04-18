import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me'
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW)

// Routes that require authentication
const PROTECTED_PATHS = ['/account', '/checkout', '/admin', '/affiliate']

// Routes that should redirect to home if already authenticated
const AUTH_PATHS = ['/login', '/register']

// Admin-only routes
const ADMIN_PATHS = ['/admin']

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] })
    return payload as { sub: string; email: string; role: string; name: string }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Redirect to home if accessing auth routes while authenticated
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  
  // Check admin access
  if (isAdminPath && user?.role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
