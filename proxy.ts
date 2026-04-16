import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_PATHS = ['/admin']
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const PROTECTED_PATHS = ['/account', '/checkout', '/affiliate']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token =
    request.cookies.get('vg_session')?.value ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    if (token) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/affiliate/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ],
}
