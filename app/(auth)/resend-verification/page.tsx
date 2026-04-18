'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authService } from '@/lib/services/auth.service'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormValues = z.infer<typeof schema>

export default function ResendVerificationPage() {
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    setSuccess(false)
    try {
      await authService.resendVerification(data.email)
      setSuccess(true)
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to resend verification email.')
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Check Your Email</h1>
          <p className="text-muted-foreground text-sm mb-6">
            If your account exists and is unverified, we've sent a new verification link to your email address.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Resend Verification Email</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your email address and we'll send you a new verification link
          </p>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Verification Email
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
