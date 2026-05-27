import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Browse our complete collection of phones, laptops, power banks, solar inverters, earbuds, smartwatches, and tech accessories. Free shipping on orders over ₦500,000. Nationwide delivery across Nigeria.',
  openGraph: {
    title: 'Shop All Products | Val Gadgets',
    description: 'Browse our complete collection of phones, laptops, power banks, solar inverters, earbuds, smartwatches, and tech accessories.',
    type: 'website',
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
