import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Categories',
  description: 'Browse all product categories at Val Gadgets. Find phones, laptops, power banks, solar inverters, earbuds, smartwatches, speakers, monitors, and more tech accessories.',
  openGraph: {
    title: 'Product Categories | Val Gadgets',
    description: 'Browse all product categories at Val Gadgets. Find phones, laptops, power banks, solar inverters, and more.',
    type: 'website',
  },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
