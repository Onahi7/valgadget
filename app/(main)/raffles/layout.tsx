import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Raffles',
  description: 'Enter exciting gadget raffles and win premium tech at a fraction of the price. Limited tickets available.',
  openGraph: {
    title: 'Raffles — Val Gadgets',
    description: 'Enter exciting gadget raffles and win premium tech at a fraction of the price.',
  },
}

export default function RafflesLayout({ children }: { children: React.ReactNode }) {
  return children
}
