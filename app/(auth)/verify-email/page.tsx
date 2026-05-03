'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authService } from '@/lib/services/auth.service'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('missing'); return }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => { setMessage(err?.message ?? 'Verification failed.'); setStatus('error') })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold mb-2">Verifying your email…</h1>
          <p className="text-muted-foreground text-sm">Please wait a moment.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Email Verified!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your email address has been verified. You can now access all features of Val Gadgets.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Sign In to Your Account</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'missing') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This verification link is missing a token. Please check your email for the correct link.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
        <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {message || 'This link is invalid or has expired. Request a new verification email below.'}
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/resend-verification">
              <Mail className="w-4 h-4 mr-2" />
              Resend Verification Email
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
