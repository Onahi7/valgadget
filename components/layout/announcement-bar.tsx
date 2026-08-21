'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500000)
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true)
  const announcements = useMemo(() => [
    ...(freeShippingEnabled ? [`Free shipping on orders over ₦${freeShippingThreshold.toLocaleString('en-NG')} — nationwide delivery across Nigeria.`] : []),
    'Live raffles are active now - win premium gadgets from low ticket prices.',
    'Flash deals are updated daily - check the shop for today\'s best offers.',
    'Secure checkout with flexible payment options.',
    'Same-day dispatch on orders placed before 2PM on weekdays.',
  ], [freeShippingEnabled, freeShippingThreshold])

  useEffect(() => {
    fetch('/api/store-config')
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(config => {
        setFreeShippingEnabled(Boolean(config.freeShippingEnabled))
        if (Number.isFinite(Number(config.freeShippingThreshold))) setFreeShippingThreshold(Number(config.freeShippingThreshold))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!visible) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % announcements.length)
    }, 4000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [announcements.length, visible])

  if (!visible) return null

  return (
    <div className="bg-secondary text-secondary-foreground text-xs font-medium relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-3">
        <span
          key={current}
          className="animate-fade-in px-8 text-center leading-relaxed"
        >
          {announcements[current % announcements.length]}
        </span>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary-foreground/50 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground sm:right-3"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
