'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, ShoppingCart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'You cancelled the payment. No charges were made.',
  failed: 'Your payment was declined. Please try a different payment method.',
  expired: 'The payment session expired. Please try again.',
  insufficient: 'Insufficient funds. Please try a different card or payment method.',
}

function FailedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('error') ?? 'failed'
  const orderId = searchParams.get('orderId')
  const humanMessage = ERROR_MESSAGES[reason] ?? 'Your payment could not be completed.'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-red-700 dark:text-red-400">Payment Failed</h1>
          <p className="text-muted-foreground mt-2">{humanMessage}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 text-sm text-left space-y-2">
          <p className="font-semibold">What to do next:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Check your card/account balance</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if the issue persists</li>
            <li>Reach out to our support team for help</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/checkout">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/cart">
              <ShoppingCart className="w-4 h-4 mr-2" /> Back to Cart
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/#chat">
              <MessageCircle className="w-4 h-4 mr-2" /> Contact Support
            </Link>
          </Button>
        </div>

        {orderId && (
          <p className="text-xs text-muted-foreground">
            Order reference: <span className="font-mono">{orderId}</span>. Your cart has been preserved.
          </p>
        )}
      </div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <FailedContent />
    </Suspense>
  )
}
