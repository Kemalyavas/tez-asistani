import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { analysesMetadata } from '../lib/metadata'

export const metadata: Metadata = analysesMetadata

export default function AnalysesLayout({ children }: { children: ReactNode }) {
  return children
}
