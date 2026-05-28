'use client'

import { useState } from 'react'
import { Mail, Phone, MessageCircle, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function ContactPage() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const firstName = fd.get('firstName') as string
    const lastName = fd.get('lastName') as string
    const email = fd.get('email') as string
    const subject = fd.get('subject') as string
    const message = fd.get('message') as string

    if (!firstName.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in your name, email, and message.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          subject: subject || 'Contact form submission',
          message,
        }),
      })
      if (res.ok) {
        setSent(true)
        toast.success('Message sent! We\'ll get back to you within 24 hours.')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.message || 'Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again later.')
    } finally {
      setSending(false)
    }
  }

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
          {sent ? (
            <div className="text-center py-10 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">Message sent!</p>
              <p className="text-sm text-muted-foreground">We&apos;ll get back to you within 24 hours.</p>
              <Button variant="outline" onClick={() => { setSent(false); (document.getElementById('contact-form') as HTMLFormElement)?.reset() }}>
                Send another message
              </Button>
            </div>
          ) : (
            <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input id="firstName" name="firstName" placeholder="John" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Order enquiry, product question…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" name="message" placeholder="Tell us how we can help…" rows={5} required />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
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
