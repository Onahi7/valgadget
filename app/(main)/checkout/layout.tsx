import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely with Paystack.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
