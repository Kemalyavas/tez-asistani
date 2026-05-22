import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { privacyMetadata } from '../lib/metadata'

export const metadata: Metadata = privacyMetadata

export default function PrivacyPolicyLayout({ children }: { children: ReactNode }) {
  return children
}
