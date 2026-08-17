/**
 * Centralized API client — ValGadget
 * Handles auth injection, 401 logout, token refresh, request timeout, and query-string building.
 */

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api'
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '')
const TIMEOUT_MS = 15_000

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Token is managed via httpOnly cookies. This is kept for legacy compatibility but always returns null. */
export function getToken(): string | null {
  return null
}

/** @deprecated Token is managed via httpOnly cookies. No-op. */
export function setToken(_token: string): void {
  // No-op — auth is handled entirely via httpOnly cookies set by the server
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('vg_user')
  // Call server logout to clear httpOnly cookies + revoke refresh token
  fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
}

// ─── Typed error ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e
}

// ─── Token refresh ────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Dedupe concurrent refresh calls
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-requested-with': 'XMLHttpRequest' },
      })
      if (!res.ok) return null
      // Server sets new httpOnly cookies automatically; no client-side token storage needed
      return 'cookie'
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ─── Core request ─────────────────────────────────────────────────────────────

type Params = Record<string, string | number | boolean | string[] | undefined | null>

interface ApiEnvelope<T> {
  data?: T
  message?: string | string[]
  errors?: Record<string, string[]>
  [key: string]: unknown
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const first = value.find(v => typeof v === 'string')
    if (first) return first
  }
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Params; _retry?: boolean } = {}
): Promise<T> {
  const { params, _retry, ...init } = options

  let url = `${BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        if (value.length === 0) continue
        searchParams.append(key, value.join(','))
      } else {
        searchParams.append(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'x-requested-with': 'XMLHttpRequest',
    ...((init.headers as Record<string, string>) ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal, credentials: 'include' })
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if ((err as Error).name === 'AbortError') {
      throw { message: 'Request timed out. Please try again.', status: 408 } as ApiError
    }
    throw { message: 'Network error. Check your connection.', status: 0 } as ApiError
  } finally {
    clearTimeout(timeoutId)
  }

  // Handle 401 with automatic token refresh (only retry once)
  if (res.status === 401 && !_retry) {
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register')
    if (!isAuthEndpoint) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry the original request with new token
        return request<T>(path, { ...options, _retry: true })
      }
      // Refresh failed — clear everything
      clearToken()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('vg:unauthorized'))
    }
    let errData: ApiEnvelope<unknown> = {}
    try { errData = await res.json() } catch {}
    throw {
      message: getErrorMessage(errData.message, 'Invalid email or password.'),
      status: 401,
    } as ApiError
  }

  let data: unknown
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const errData = (data as ApiEnvelope<unknown>) ?? {}
    throw {
      message: getErrorMessage(errData.message, `Request failed (${res.status})`),
      status: res.status,
      errors: errData?.errors as Record<string, string[]> | undefined,
    } as ApiError
  }

  return data as T
}

// ─── Public API object ────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, params?: Params) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  /** Multipart form-data upload — omits Content-Type so browser sets boundary */
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
      headers: {},    // override to remove Content-Type
    }),
}
