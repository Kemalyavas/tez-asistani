import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Ödeme akışı sayfaları (/payment/*) kullanıcıya özel ve geçicidir.
// robots.txt zaten /payment/ disallow ediyor; bu noindex ek savunma katmanıdır
// (başka bir yerden link gelirse URL-only indexlenmesini de engeller).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return children
}
