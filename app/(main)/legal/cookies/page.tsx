import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'ValGadget cookie policy — how we use cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-reveal">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 2025</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. What Are Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, understand usage patterns, and improve your experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How We Use Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use essential cookies for site functionality (authentication, cart, wishlist), analytics cookies to understand how visitors interact with our site, and marketing cookies to deliver relevant content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Third-Party Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use services like Paystack (payment processing), Google Analytics (site analytics), and Vercel Analytics (performance monitoring) which may set their own cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Managing Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You can control and delete cookies through your browser settings. Note that disabling cookies may affect the functionality of our website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Contact</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            For questions about our cookie practices, contact us at <a href="mailto:support@valgadgets.com" className="text-primary hover:underline">support@valgadgets.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
