import { ImageResponse } from 'next/server'

export const runtime = 'edge'
export const alt = 'TezAI – AI Thesis Writing Assistant'
export const contentType = 'image/png'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'TezAI – AI Thesis Writing Assistant'
  const subtitle = searchParams.get('subtitle') || 'APA/MLA/Chicago Citations • Abstracts • Thesis Tools'
}