'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'
import { Suspense } from 'react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

function getSafeReturnUrl(value: string) {
  try {
    const decoded = decodeURIComponent(value)
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/admin'
    if (!decoded.startsWith('/admin')) return '/admin'
    return decoded
  } catch {
    return '/admin'
  }
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent />
    </Suspense>
  )
}

function AdminLoginContent() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/admin'
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && user?.role === 'admin') {
      router.replace(getSafeReturnUrl(returnUrl))
    }
  }, [isAuthenticated, isLoading, user, router, returnUrl])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      const signedInUser = await login(data.email, data.password)
      if (signedInUser.role !== 'admin') {
        await logout()
        setApiError('Access denied. Admin credentials required.')
        return
      }
      toast.success('Welcome back!')
      router.replace(getSafeReturnUrl(returnUrl))
      router.refresh()
    } catch (err) {
      const e = err as ApiError
      setApiError(e.message ?? 'Login failed. Please try again.')
    }
  }

  if (isLoading || (isAuthenticated && user?.role === 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Admin Sign in</h1>
              <p className="text-muted-foreground text-sm mt-1">Access the ValGadget admin panel</p>
            </div>

            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@valgadget.ng"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Sign in to Admin
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

function AdminLoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mb-8 space-y-2">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="h-8 w-48 rounded bg-muted animate-pulse mx-auto" />
            <div className="h-4 w-56 rounded bg-muted animate-pulse mx-auto" />
          </div>
          <div className="space-y-5">
            <div className="h-11 w-full rounded bg-muted animate-pulse" />
            <div className="h-11 w-full rounded bg-muted animate-pulse" />
            <div className="h-11 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
