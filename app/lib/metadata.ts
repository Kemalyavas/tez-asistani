import type { Metadata } from 'next'

// Main site metadata
export const siteMetadata = {
  title: 'TezAI - Thesis Writing Assistant | AI-Powered Academic Writing Tool',
  description: 'AI-powered citation formatting, abstract generation, and writing assistance for your theses, papers, and academic work. Automatic reference formatting in APA, MLA, Chicago styles. The most advanced academic writing platform.',
  keywords: [
    // Main target keywords
    'thesis assistant', 'academic writing', 'thesis writing tool', 'reference formatter',
    'citation formatting', 'academic paper assistant', 'thesis abstract', 'literature review',
    
    // Long-tail keywords
    'apa format tool', 'mla format generator', 'chicago style references',
    'thesis bibliography organizer', 'academic writing rules', 'paper citations',
    'bibliography generator', 'citation format', 'academic research',
    
    // Türkiye odaklı
    'türkiye tez yazım', 'türk üniversiteleri tez', 'yök tez formatı',
    'üniversite tez kuralları', 'lisansüstü tez', 'doktora tezi yazım',
    'yüksek lisans tezi', 'akademisyen araçları türkiye',
    
    // Teknoloji odaklı
    'ai akademik yazım', 'yapay zeka tez asistanı', 'otomatik referans',
    'akıllı akademik araçlar', 'dijital tez yazım', 'online akademik platform'
  ],
  url: 'https://tez-asistani.vercel.app',
  siteName: 'TezAI',
  images: [
    {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Tez Asistanı - AI Destekli Akademik Yazım Aracı',
    }
  ],
  locale: 'tr_TR',
  type: 'website',
  author: 'Tez Asistanı Ekibi',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
}

// Ana sayfa metadata
export const homeMetadata: Metadata = {
  metadataBase: new URL('https://tez-asistani.vercel.app'),
  title: 'TezAI - Tez Yazım Asistanı | AI Destekli Akademik Yazım Aracı',
  description: 'Tez ve akademik çalışmalarınızı hızlandırın! AI destekli kaynak formatı (APA, MLA, Chicago), otomatik özet oluşturma, referans düzenleme. Türkiye\'nin en gelişmiş akademik yazım platformu. Ücretsiz deneyin!',
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
    title: 'Tez Asistanı - AI Destekli Akademik Yazım Aracı | Türkiye #1',
    description: 'Tez ve akademik çalışmalarınızı hızlandırın! AI destekli kaynak formatı, otomatik özet oluşturma, referans düzenleme. Türkiye\'nin en gelişmiş akademik yazım platformu.',
    url: siteMetadata.url,
    siteName: siteMetadata.siteName,
    images: siteMetadata.images,
    locale: siteMetadata.locale,
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tez Asistanı - AI Destekli Akademik Yazım Aracı',
    description: 'Tez ve akademik çalışmalarınızı hızlandırın! AI destekli kaynak formatı, otomatik özet oluşturma, referans düzenleme.',
    images: [siteMetadata.images[0].url],
    creator: '@tezasistani',
    site: '@tezasistani'
  },
  alternates: {
    canonical: siteMetadata.url,
    languages: {
      'tr-TR': siteMetadata.url,
    },
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
  },
  alternates: {
    canonical: `${siteMetadata.url}/pricing`,
  }
}

// Auth sayfası metadata  
export const authMetadata: Metadata = {
  title: 'Giriş Yap - Tez Asistanı | Akademik Yazım Platformu',
  description: 'Tez Asistanı\'na giriş yapın ve AI destekli akademik yazım araçlarından faydalanın. Güvenli giriş, ücretsiz kayıt, sosyal medya ile hızlı giriş imkanları.',
  keywords: 'tez asistanı giriş, akademik platform kayıt, üniversite öğrenci giriş, akademisyen platformu giriş',
  robots: 'noindex, nofollow', // Auth sayfaları indexlenmemeli
  openGraph: {
    title: 'Giriş Yap - Tez Asistanı',
    description: 'Akademik yazım araçlarına erişmek için giriş yapın.',
    url: `${siteMetadata.url}/auth`,
  }
}

// Profile sayfası metadata
export const profileMetadata: Metadata = {
  title: 'Profilim - Tez Asistanı | Hesap Yönetimi',
  description: 'Tez Asistanı hesap ayarlarınızı yönetin. Kullanım istatistiklerinizi görün, planınızı yükseltin, kişisel bilgilerinizi güncelleyin.',
  robots: 'noindex, nofollow', // Kişisel sayfalar indexlenmemeli
  openGraph: {
    title: 'Profilim - Tez Asistanı',
    url: `${siteMetadata.url}/profile`,
  }
}

// Privacy Policy metadata
export const privacyMetadata: Metadata = {
  title: 'Gizlilik Politikası - Tez Asistanı | KVKK Uyumlu Veri Koruma',
  description: 'Tez Asistanı gizlilik politikası ve kişisel veri koruma uygulamaları. KVKK, GDPR uyumlu veri işleme politikalarımız hakkında detaylı bilgi.',
  keywords: 'tez asistanı gizlilik, kvkk uygunluk, veri koruma, akademik platform güvenlik, kişisel veri politikası',
  openGraph: {
    title: 'Gizlilik Politikası - Tez Asistanı',
    description: 'KVKV ve GDPR uyumlu gizlilik politikalarımız hakkında bilgi edinin.',
    url: `${siteMetadata.url}/privacy-policy`,
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
    title: `${title} | Tez Asistanı Blog`,
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
  title: 'Sıkça Sorulan Sorular - Tez Asistanı | Akademik Yazım SSS',
  description: 'Tez Asistanı hakkında merak ettiklerinizin cevapları: Nasıl kullanılır, fiyatlandırma, referans formatları, güvenlik, KVKK uygunluk ve daha fazlası.',
  keywords: 'tez asistanı sss, akademik yazım sorular, referans formatı nasıl, apa format soruları, tez yazım yardım',
  openGraph: {
    title: 'Sıkça Sorulan Sorular - Tez Asistanı',
    description: 'Tez Asistanı hakkında merak ettiklerinizin cevapları.',
    url: `${siteMetadata.url}/sss`,
  },
  alternates: {
    canonical: `${siteMetadata.url}/sss`,
  }
}
