import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { profileMetadata } from '../lib/metadata'

export const metadata: Metadata = profileMetadata

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children
}
