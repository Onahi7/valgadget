'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const ANNOUNCEMENTS = [
  '🚚 Free shipping on orders over ₦50,000 — Nationwide delivery to all 37 states!',
  '🎟 Live Raffles active now — Win an iPhone 15 Pro Max for just ₦2,500!',
  '⚡ Flash deals updated daily — check the shop for today\'s best offers',
  '🔒 100% secure checkout — Pay via card, bank transfer, or crypto',
  '📦 Same-day dispatch on orders placed before 2PM on weekdays',
]

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % ANNOUNCEMENTS.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  if (!visible) return null

  return (
    <div className="bg-secondary text-secondary-foreground text-xs font-medium relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-3">
        <span
          key={current}
          className="animate-fade-in text-center leading-relaxed pr-6"
        >
          {ANNOUNCEMENTS[current]}
        </span>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground/50 hover:text-secondary-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
