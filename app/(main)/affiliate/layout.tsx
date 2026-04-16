import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Dashboard',
  description: 'Track your affiliate earnings, clicks, and conversions. Earn commissions by sharing your unique referral link.',
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children
}
