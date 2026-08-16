import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric price as Nigerian Naira with 2 decimals.
 * Example: 41532 -> "₦41,532.00"
 * `withCode` is accepted for backwards compatibility but the code suffix is
 * no longer appended — the ₦ symbol alone is the standard.
 */
export function formatPrice(value: number, withCode = false): string {
  void withCode
  const formatted = value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `₦${formatted}`
}

/**
 * Compact price for tight spaces — no decimals.
 * Example: 41532 -> "₦41,532"
 */
export function formatPriceShort(value: number): string {
  return `₦${value.toLocaleString('en-NG')}`
}
