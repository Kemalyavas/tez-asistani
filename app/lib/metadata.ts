import type { Metadata } from 'next'

// Main site metadata
export const siteMetadata = {
  title: 'TezAI - Thesis Writing Assistant | AI-Powered Academic Writing Tool',
  description: 'AI-powered citation formatting, abstract generation, and writing assistance for your theses, papers, and academic work. Automatic reference formatting in APA, MLA, Chicago styles. The most advanced academic writing platform.',
  keywords: [
    // Primary keywords (en-US)
    'thesis assistant', 'academic writing tool', 'citation generator',
    'APA formatter', 'MLA formatter', 'Chicago style references',
    'bibliography generator', 'abstract generator', 'thesis writing',
    'reference manager', 'research assistant', 'academic research'
  ],
  url: 'https://www.tezai.com.tr',
  siteName: 'TezAI',
  images: [
    {
      // Use dynamic OG generator to ensure a valid 1200x630 image
      url: '/og',
      width: 1200,
      height: 630,
      alt: 'TezAI – AI-Powered Academic Writing',
    }
  ],
  locale: 'en_US',
  type: 'website',
  author: 'TezAI Team',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
}

// Ana sayfa metadata
export const homeMetadata: Metadata = {
  metadataBase: new URL('https://www.tezai.com.tr'),
  title: 'TezAI - Thesis Writing Assistant | AI Academic Writing Tool',
  description: 'Speed up your thesis and academic writing! AI-powered citation formatting (APA, MLA, Chicago), automatic abstract generation, and reference management. Try it free.',
  keywords: siteMetadata.keywords.join(', '),
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  publisher: siteMetadata.siteName,
  robots: siteMetadata.robots,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/logo.png',
    },
  },
  openGraph: {
    title: 'TezAI - AI-Powered Academic Writing Tool',
    description: 'AI-powered citation formatting, abstract generation, and reference management.',
    url: siteMetadata.url,
    siteName: siteMetadata.siteName,
    images: siteMetadata.images,
    locale: siteMetadata.locale,
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TezAI - AI-Powered Academic Writing Tool',
    description: 'AI-powered citation formatting, abstract generation, and reference management.',
    images: [siteMetadata.images[0].url],
    creator: '@tezasistani',
    site: '@tezasistani'
  },
  alternates: {
    canonical: siteMetadata.url,
    languages: { 'en-US': siteMetadata.url },
  },
  category: 'Education Technology',
  classification: 'Academic Writing Tool'
}

// Pricing sayfası metadata
export const pricingMetadata: Metadata = {
  title: 'Pricing - TezAI | Academic Writing Tools',
  description: 'TezAI pricing plans: Start free, upgrade to Pro ($9/month) or Expert ($25/month) for advanced academic writing capabilities with AI.',
  keywords: 'thesis assistant pricing, academic writing tool pricing, citation generator price, AI thesis tool subscription, student discount academic writing',
  openGraph: {
    title: 'Pricing - TezAI | Academic Writing Tools',
    description: 'Affordable academic writing tools. Start free, unlock more with Pro ($9) or Expert ($25) plans.',
    url: `${siteMetadata.url}/pricing`,
    images: [{ url: '/og?title=TezAI%20Pricing&subtitle=Pro%20%249%20%E2%80%A2%20Expert%20%2425', width: 1200, height: 630, alt: 'TezAI Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - TezAI',
    description: 'Affordable academic writing tools. Start free, unlock more with Pro ($9) or Expert ($25) plans.',
    images: ['/og?title=TezAI%20Pricing&subtitle=Pro%20%249%20%E2%80%A2%20Expert%20%2425'],
  },
  alternates: {
    canonical: `${siteMetadata.url}/pricing`,
  }
}

// Auth sayfası metadata  
export const authMetadata: Metadata = {
  title: 'Sign In - TezAI | Academic Writing Platform',
  description: 'Sign in to TezAI and access AI-powered academic writing tools. Secure login and free signup.',
  keywords: 'thesis assistant login, academic writing platform signup, university student login, academic platform login',
  robots: 'noindex, nofollow', // Auth sayfaları indexlenmemeli
  openGraph: {
    title: 'Sign In - TezAI',
    description: 'Sign in to access academic writing tools.',
    url: `${siteMetadata.url}/auth`,
  }
}

// Profile sayfası metadata
export const profileMetadata: Metadata = {
  title: 'My Profile - TezAI | Account Management',
  description: 'Manage your TezAI account settings. View usage stats, upgrade your plan, and update personal info.',
  robots: 'noindex, nofollow', // Kişisel sayfalar indexlenmemeli
  openGraph: {
    title: 'My Profile - TezAI',
    url: `${siteMetadata.url}/profile`,
  }
}

// Privacy Policy metadata
export const privacyMetadata: Metadata = {
  title: 'Privacy Policy - TezAI | GDPR-Compliant Data Protection',
  description: 'TezAI privacy policy and data protection practices. GDPR-compliant processing and security measures.',
  keywords: 'tezai privacy, gdpr compliance, data protection, academic platform security, privacy policy',
  openGraph: {
    title: 'Privacy Policy - TezAI',
    description: 'Learn about our GDPR-compliant privacy practices.',
    url: `${siteMetadata.url}/privacy-policy`,
    images: [{ url: '/og?title=Privacy%20Policy&subtitle=GDPR%20Compliant%20Data%20Protection', width: 1200, height: 630, alt: 'Privacy Policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - TezAI',
    description: 'Learn about our GDPR-compliant privacy practices.',
    images: ['/og?title=Privacy%20Policy&subtitle=GDPR%20Compliant%20Data%20Protection'],
  },
  alternates: {
    canonical: `${siteMetadata.url}/privacy-policy`,
  }
}

// Blog/Article için dinamik metadata fonksiyonu
export function generateArticleMetadata({
  title,
  description,
  slug,
  publishedTime,
  modifiedTime,
  tags = [],
  author = siteMetadata.author,
  image = siteMetadata.images[0].url
}: {
  title: string
  description: string
  slug: string
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  author?: string
  image?: string
}): Metadata {
  const url = `${siteMetadata.url}/blog/${slug}`
  
  return {
    title: `${title} | TezAI Blog`,
    description,
    keywords: [...tags, ...siteMetadata.keywords.slice(0, 10)].join(', '),
    authors: [{ name: author }],
    openGraph: {
      title,
      description,
      url,
      siteName: siteMetadata.siteName,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: siteMetadata.locale,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [author],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@tezasistani',
    },
    alternates: {
      canonical: url,
    },
  }
}

// FAQ sayfası metadata
export const faqMetadata: Metadata = {
  title: 'FAQ - TezAI | Academic Writing Help',
  description: 'Answers to common questions: how it works, pricing, citation styles, security, and more.',
  keywords: 'tezai faq, academic writing faq, apa format, mla format, citation help',
  openGraph: {
    title: 'FAQ - TezAI',
    description: 'Common questions about TezAI.',
    url: `${siteMetadata.url}/faq`,
    images: [{ url: '/og?title=FAQ&subtitle=How%20TezAI%20Works%2C%20Pricing%2C%20Security', width: 1200, height: 630, alt: 'FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - TezAI',
    description: 'Common questions about TezAI.',
    images: ['/og?title=FAQ&subtitle=How%20TezAI%20Works%2C%20Pricing%2C%20Security'],
  },
  alternates: {
    canonical: `${siteMetadata.url}/faq`,
  }
}
