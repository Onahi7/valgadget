'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
  terms: z.boolean().refine(v => v, 'You must accept the terms'),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  )
}

function RegisterPageContent() {
  const { register: authRegister } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/'
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  })

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      await authRegister(data.name, data.email, data.password)
      toast.success('Account created!', { description: 'Welcome to ValGadget.' })
      
      // Small delay to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      router.push(decodeURIComponent(returnUrl))
    } catch (err) {
      const e = err as ApiError
      setApiError(e.message ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join thousands of tech enthusiasts</p>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Alex Johnson" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" placeholder="Repeat your password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />
            {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={watch('terms')}
                onCheckedChange={v => setValue('terms', !!v, { shouldValidate: true })}
                aria-invalid={!!errors.terms}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>
            {errors.terms && <p className="text-destructive text-xs">{errors.terms.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Create Account
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href={`/login${returnUrl !== '/' ? `?returnUrl=${returnUrl}` : ''}`} className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function RegisterPageFallback() {
  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-5">
          <div className="h-11 w-full rounded bg-muted animate-pulse" />
          <div className="h-11 w-full rounded bg-muted animate-pulse" />
          <div className="h-11 w-full rounded bg-muted animate-pulse" />
          <div className="h-11 w-full rounded bg-muted animate-pulse" />
          <div className="h-11 w-full rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
