import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ValGadget terms of service — the rules and guidelines governing the use of our website and services.',
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-reveal">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 2025</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            By accessing and using ValGadget&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Products & Pricing</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All product prices are displayed in Nigerian Naira (₦). We reserve the right to change prices without notice. Prices at the time of order placement are final.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Orders & Payment</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            By placing an order, you agree to provide accurate and complete information. We currently accept Paystack (cards, bank transfer, and USSD). Payment must be completed before order fulfillment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Shipping & Delivery</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We ship nationwide across Nigeria. Delivery times vary by location and are estimates, not guarantees. Risk of loss transfers to you upon delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Returns & Refunds</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please refer to our <a href="/legal/returns" className="text-primary hover:underline">Return Policy</a> for details on returns, exchanges, and refunds.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Limitation of Liability</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            ValGadget shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Contact</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            For questions about these terms, contact us at <a href="mailto:support@valgadgets.com" className="text-primary hover:underline">support@valgadgets.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
