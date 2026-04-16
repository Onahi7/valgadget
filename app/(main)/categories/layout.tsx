import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse gadgets by category — phones, laptops, power banks, audio, smart home, accessories, and more.',
  openGraph: {
    title: 'Categories — Val Gadgets',
    description: 'Browse gadgets by category — phones, laptops, power banks, audio, smart home, accessories.',
  },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
