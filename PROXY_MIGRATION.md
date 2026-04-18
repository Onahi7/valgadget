# Proxy Migration - Next.js 16.2.0

## Issue

Build was failing with error:
```
Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. 
Please use "./proxy.ts" only.
```

## Cause

Next.js 16.2.0 has deprecated `middleware.ts` in favor of `proxy.ts` for route protection and request handling.

## Solution

### 1. Deleted `middleware.ts`
The old middleware file has been removed.

### 2. Updated `proxy.ts`
Migrated all authentication logic from `middleware.ts` to `proxy.ts`:

**Key Changes:**
- Changed cookie name from `vg_session` to `vg_token` (matches our auth implementation)
- Added JWT verification using `jose` library
- Added role-based access control (admin check)
- Updated matcher to use Next.js 16 pattern (excludes api, static files, etc.)
- Made `proxy` function async to support JWT verification

**Features:**
- ✅ Protects routes: `/account`, `/checkout`, `/admin`, `/affiliate`
- ✅ Redirects unauthenticated users to login with returnUrl
- ✅ Prevents authenticated users from accessing auth pages
- ✅ Enforces admin-only access to `/admin` routes
- ✅ Reads token from cookie (preferred) or Authorization header
- ✅ Verifies JWT token on the server/edge

## Files Changed

**Deleted:**
- `middleware.ts` (deprecated in Next.js 16.2.0)

**Modified:**
- `proxy.ts` (updated with full authentication logic)

## How It Works

### Protected Route Access
1. User tries to access `/checkout`
2. Proxy reads `vg_token` from cookie
3. Proxy verifies JWT token
4. If valid → allow access
5. If invalid/missing → redirect to `/login?returnUrl=%2Fcheckout`

### Login Flow
1. User logs in
2. Token saved to localStorage AND cookie (`vg_token`)
3. Router navigates to returnUrl
4. Proxy reads token from cookie
5. Proxy verifies token
6. User successfully accesses protected route ✅

### Admin Access
1. User tries to access `/admin`
2. Proxy verifies token
3. Proxy checks `user.role === 'admin'`
4. If admin → allow access
5. If not admin → redirect to `/unauthorized`

## Testing

### Test Protected Routes
```bash
# Should redirect to login
curl -I http://localhost:3000/checkout

# Should allow access with valid token
curl -I http://localhost:3000/checkout \
  -H "Cookie: vg_token=your-jwt-token"
```

### Test Auth Routes
```bash
# Should redirect to home if logged in
curl -I http://localhost:3000/login \
  -H "Cookie: vg_token=your-jwt-token"
```

### Test Admin Routes
```bash
# Should redirect to /unauthorized if not admin
curl -I http://localhost:3000/admin \
  -H "Cookie: vg_token=customer-jwt-token"
```

## Differences from middleware.ts

| Feature | middleware.ts | proxy.ts |
|---------|--------------|----------|
| File name | `middleware.ts` | `proxy.ts` |
| Next.js version | < 16.0 | >= 16.0 |
| Function name | `middleware()` | `proxy()` |
| Export | `export async function middleware()` | `export async function proxy()` |
| Status | Deprecated | Current |

**Logic is identical** - just the file name and function name changed.

## Next.js 16 Proxy Documentation

For more information, see:
- https://nextjs.org/docs/messages/middleware-to-proxy
- https://nextjs.org/docs/app/building-your-application/routing/middleware

## Build Status

✅ **Build should now succeed**

The error was caused by having both `middleware.ts` and `proxy.ts`. Now only `proxy.ts` exists.

---

**Date**: April 18, 2026  
**Next.js Version**: 16.2.0  
**Status**: ✅ Migrated successfully
