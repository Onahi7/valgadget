import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Return Policy',
  description: 'ValGadget return policy — our guidelines for returns, exchanges, and refunds.',
  openGraph: {
    title: 'Return Policy | Val Gadgets',
    description: 'ValGadget return policy — our guidelines for returns, exchanges, and refunds.',
  },
  twitter: {
    card: 'summary',
    title: 'Return Policy | Val Gadgets',
    description: 'ValGadget return policy — our guidelines for returns, exchanges, and refunds.',
  },
}

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-reveal">
      <h1 className="text-3xl font-bold mb-2">Return Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. Eligibility</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Items may be returned within 7 days of delivery if they are unused, in original packaging, and in the same condition as received. Custom or personalized items are not eligible for return.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Defective or Damaged Items</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you receive a defective or damaged item, contact us within 48 hours of delivery with photos. We will arrange a replacement or full refund including shipping costs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. How to Return</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            To initiate a return, contact our support team at <a href="mailto:support@valgadgets.com" className="text-primary hover:underline">support@valgadgets.com</a> with your order reference. You will receive return instructions within 24 hours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Refunds</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method. Shipping costs are non-refundable unless the return is due to our error.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Exchanges</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We do not offer direct exchanges. To exchange an item, return the original and place a new order for the desired item.
          </p>
        </section>
      </div>
    </div>
  )
}
