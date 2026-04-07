'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authService } from '@/lib/services/auth.service'
import type { ApiError } from '@/lib/api-client'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      await authService.forgotPassword({ email: data.email })
      setSent(true)
    } catch (err) {
      const e = err as ApiError
      setApiError(e.message ?? 'Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Check your inbox</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            We&apos;ve sent a password reset link to your email. It may take a few minutes.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your email and we&apos;ll send a reset link</p>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 h-11">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Reset Link
              </span>
            )}
          </Button>
        </form>

        <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
          <Link href="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
