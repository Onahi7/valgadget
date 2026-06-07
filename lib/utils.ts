import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric price as Nigerian Naira with 2 decimals + "NGN" suffix.
 * Example: 41532 -> "₦41,532.00 NGN"
 */
export function formatPrice(value: number, withCode = true): string {
  const formatted = value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return withCode ? `₦${formatted} NGN` : `₦${formatted}`
}

/**
 * Compact price for tight spaces — no decimals, no code.
 * Example: 41532 -> "₦41,532"
 */
export function formatPriceShort(value: number): string {
  return `₦${value.toLocaleString('en-NG')}`
}
