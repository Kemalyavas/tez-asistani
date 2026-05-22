import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { deliveryReturnsMetadata } from '../lib/metadata'

export const metadata: Metadata = deliveryReturnsMetadata

export default function DeliveryReturnsLayout({ children }: { children: ReactNode }) {
  return children
}
