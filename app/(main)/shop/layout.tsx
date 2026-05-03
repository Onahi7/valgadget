import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse our full collection of phones, laptops, power banks, earbuds, solar inverters & accessories. Nationwide delivery across Nigeria.',
  openGraph: {
    title: 'Shop — Val Gadgets',
    description: 'Browse our full collection of premium gadgets. Nationwide delivery across Nigeria.',
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
