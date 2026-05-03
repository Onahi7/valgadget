import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ValGadget privacy policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-reveal">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 2025</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We collect information you provide directly, such as your name, email address, phone number, shipping address, and payment details when you place an order or create an account. We also automatically collect certain device and usage information when you visit our site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use your information to process orders, deliver products, communicate about your purchases, provide customer support, improve our services, and send promotional communications (with your consent).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Information Sharing</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We do not sell your personal information. We share information with service providers who assist in operating our platform (payment processors, shipping partners, email services), and when required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Data Security</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Your Rights</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You may access, update, or delete your personal information by contacting us. You may also opt out of promotional communications at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Contact</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            For privacy-related inquiries, please contact us at <a href="mailto:support@valgadgets.com" className="text-primary hover:underline">support@valgadgets.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
