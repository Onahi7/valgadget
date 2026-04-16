import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely with multiple payment options including Paystack, crypto, and cash on delivery.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
