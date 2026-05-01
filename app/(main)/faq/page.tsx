'use client'

import { useState } from 'react'
import { Search, ChevronDown, Package, CreditCard, Truck, RotateCcw, Shield, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FAQ {
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  // Orders & Checkout
  {
    category: 'Orders & Checkout',
    question: 'Do I need to create an account to place an order?',
    answer: 'No! You can checkout as a guest by simply providing your email address. However, creating an account allows you to track orders, save addresses, and checkout faster in the future.',
  },
  {
    category: 'Orders & Checkout',
    question: 'How do I track my order?',
    answer: 'After placing your order, you\'ll receive a confirmation email with a tracking link. You can also track your order by logging into your account and visiting the Orders page.',
  },
  {
    category: 'Orders & Checkout',
    question: 'Can I modify or cancel my order?',
    answer: 'You can cancel your order within 1 hour of placement if it hasn\'t been processed yet. Contact our support team immediately if you need to make changes.',
  },
  {
    category: 'Orders & Checkout',
    question: 'What payment methods do you accept?',
    answer: 'We currently accept Paystack (cards, bank transfer, and USSD).',
  },

  // Shipping & Delivery
  {
    category: 'Shipping & Delivery',
    question: 'How long does shipping take?',
    answer: 'Delivery times vary by location. Lagos typically receives orders within 1-3 business days, while other states may take 3-7 business days. You\'ll see estimated delivery time at checkout.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Do you ship nationwide?',
    answer: 'Yes! We ship to all 36 states in Nigeria plus the FCT. Shipping costs are calculated based on your location at checkout.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Is there free shipping?',
    answer: 'Yes! Orders over ₦50,000 qualify for free shipping nationwide. We also occasionally offer free shipping promotions - check our homepage for current offers.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Can I change my delivery address?',
    answer: 'Yes, you can change your delivery address before your order ships. Contact our support team as soon as possible with your order number and new address.',
  },

  // Returns & Refunds
  {
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy for most items. Products must be unused, in original packaging, and with all tags attached. Some items like opened electronics may not be eligible for return.',
  },
  {
    category: 'Returns & Refunds',
    question: 'How do I return an item?',
    answer: 'Log into your account, go to your order history, and click "Request Return" on the eligible order. Follow the instructions to print your return label and ship the item back to us.',
  },
  {
    category: 'Returns & Refunds',
    question: 'When will I receive my refund?',
    answer: 'Refunds are processed within 5-7 business days after we receive and inspect your returned item. The refund will be issued to your original payment method.',
  },
  {
    category: 'Returns & Refunds',
    question: 'Who pays for return shipping?',
    answer: 'If the return is due to our error (wrong item, defective product), we cover return shipping. For other returns, customers are responsible for return shipping costs.',
  },

  // Products & Stock
  {
    category: 'Products & Stock',
    question: 'Are your products authentic?',
    answer: 'Yes! All our products are 100% authentic and sourced directly from authorized distributors and manufacturers. We guarantee the authenticity of every item we sell.',
  },
  {
    category: 'Products & Stock',
    question: 'When will out-of-stock items be available?',
    answer: 'Restock times vary by product. You can sign up for email notifications on product pages to be alerted when items are back in stock.',
  },
  {
    category: 'Products & Stock',
    question: 'Do you offer product warranties?',
    answer: 'Yes! Most electronics and appliances come with manufacturer warranties. Warranty details are listed on each product page. We also offer extended warranty options at checkout.',
  },
  {
    category: 'Products & Stock',
    question: 'Can I pre-order upcoming products?',
    answer: 'Yes! When available, pre-orders can be placed on product pages. You\'ll only be charged when the item ships, and you\'ll receive it on or shortly after the release date.',
  },

  // Account & Security
  {
    category: 'Account & Security',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send you a password reset link. The link is valid for 1 hour.',
  },
  {
    category: 'Account & Security',
    question: 'Is my payment information secure?',
    answer: 'Absolutely! We use industry-standard encryption and never store your full card details. All payments are processed through secure, PCI-compliant payment gateways.',
  },
  {
    category: 'Account & Security',
    question: 'Can I save multiple delivery addresses?',
    answer: 'Yes! You can save unlimited delivery addresses in your account. This makes checkout faster when shipping to different locations.',
  },

  // Promotions & Coupons
  {
    category: 'Promotions & Coupons',
    question: 'How do I use a coupon code?',
    answer: 'Enter your coupon code in the cart page before checkout. The discount will be applied automatically if the code is valid and meets any minimum purchase requirements.',
  },
  {
    category: 'Promotions & Coupons',
    question: 'Can I use multiple coupons on one order?',
    answer: 'No, only one coupon code can be used per order. The system will apply whichever code gives you the best discount.',
  },
  {
    category: 'Promotions & Coupons',
    question: 'Why isn\'t my coupon code working?',
    answer: 'Coupon codes may have expiry dates, usage limits, or minimum purchase requirements. Check the terms of your specific code. If you\'re still having issues, contact support.',
  },
]

const categories = Array.from(new Set(faqs.map(f => f.category)))

const categoryIcons: Record<string, any> = {
  'Orders & Checkout': Package,
  'Shipping & Delivery': Truck,
  'Returns & Refunds': RotateCcw,
  'Products & Stock': Shield,
  'Account & Security': Shield,
  'Promotions & Coupons': CreditCard,
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const groupedFAQs = categories.reduce((acc, category) => {
    acc[category] = filteredFAQs.filter(f => f.category === category)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
      <Breadcrumbs 
        className="mb-8"
        items={[{ label: 'FAQ' }]}
      />

      {/* Header */}
      <div className="text-center mb-12">
        <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg">
          Find answers to common questions about orders, shipping, returns, and more
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map(category => {
          const Icon = categoryIcons[category] || HelpCircle
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {category}
            </Button>
          )
        })}
      </div>

      {/* FAQs */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <p className="text-muted-foreground mb-4">No FAQs found matching your search</p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => {
            if (categoryFAQs.length === 0) return null
            const Icon = categoryIcons[category] || HelpCircle

            return (
              <div key={category} className="bg-card border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {categoryFAQs.map((faq, index) => (
                    <AccordionItem key={index} value={`${category}-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )
          })}
        </div>
      )}

      {/* Still Need Help */}
      <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2">Still need help?</h3>
        <p className="text-muted-foreground mb-6">
          Can't find the answer you're looking for? Our support team is here to help.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
