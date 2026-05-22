import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { pricingMetadata } from '../lib/metadata'

export const metadata: Metadata = pricingMetadata

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children
}
