import { Mail, Phone, MessageCircle, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Val Gadgets. We\'re here to help with any questions about our products, orders, or services.',
}

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Get In Touch</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Have a question about a product, an order, or just want to say hello?
          We&apos;re here and happy to help — usually within a few hours.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-5">Send us a message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Order enquiry, product question…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Tell us how we can help…" rows={5} />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Other ways to reach us</h2>
            <div className="space-y-4">
              {[
                { Icon: Phone, label: 'WhatsApp / Call', value: '+234 703 857 2046', detail: 'Available Mon–Sat, 9am–6pm' },
                { Icon: Mail, label: 'Email', value: 'support@valgadgets.com', detail: 'We reply within 24 hours' },
                { Icon: MessageCircle, label: 'Live Chat', value: 'Chat with us on the website', detail: 'Bottom-right corner of any page' },
                { Icon: MapPin, label: 'Location', value: 'Lagos, Nigeria', detail: 'Nationwide delivery available' },
                { Icon: Clock, label: 'Business Hours', value: 'Mon – Sat: 9am – 6pm', detail: 'Sunday: Closed' },
              ].map(({ Icon, label, value, detail }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm">{value}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-2">Follow us for deals & updates</h3>
            <div className="flex gap-3 mt-3">
              <a href="https://www.tiktok.com/@valgadgets" target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline">TikTok @valgadgets</a>
              <span className="text-muted-foreground">·</span>
              <a href="https://x.com/Val_Gadget" target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary hover:underline">X @Val_Gadget</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
