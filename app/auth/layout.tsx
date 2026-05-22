import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { authMetadata } from '../lib/metadata'

export const metadata: Metadata = authMetadata

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
