import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resend Verification Email',
  description: 'Request a new email verification link',
}

export default function ResendVerificationLayout({ children }: { children: React.ReactNode }) {
  return children
}
