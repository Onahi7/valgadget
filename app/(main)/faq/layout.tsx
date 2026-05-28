import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about ValGadget orders, shipping, returns, payments, and account security.',
  openGraph: {
    title: 'FAQ | Val Gadgets',
    description: 'Find answers to common questions about ValGadget orders, shipping, returns, payments, and account security.',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ | Val Gadgets',
    description: 'Find answers to common questions about ValGadget orders, shipping, returns, payments, and account security.',
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
