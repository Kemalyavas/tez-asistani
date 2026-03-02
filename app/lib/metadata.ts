import type { Metadata } from 'next'

// Main site metadata
export const siteMetadata = {
  title: 'TezAI - Tez Yazım Asistanı | Yapay Zeka Destekli Akademik Yazım Aracı',
  description: 'Tezleriniz, makaleleriniz ve akademik çalışmalarınız için yapay zeka destekli kaynak formatlama, özet oluşturma ve yazım yardımı. APA, MLA, Chicago stillerinde otomatik kaynak formatlama.',
  keywords: [
    // Türkçe anahtar kelimeler
    'tez asistanı', 'akademik yazım aracı', 'kaynak gösterme',
    'APA formatı', 'MLA formatı', 'Chicago kaynak stili',
    'kaynakça oluşturucu', 'özet oluşturucu', 'tez yazımı',
    'kaynak yönetimi', 'araştırma asistanı', 'akademik araştırma',
    // English keywords (for international SEO)
    'thesis assistant', 'citation generator', 'abstract generator',
    'APA formatter', 'MLA formatter', 'academic writing tool'
  ],
  url: 'https://www.tezai.com.tr',
  siteName: 'TezAI',
  images: [
    {
      url: '/og',
      width: 1200,
      height: 630,
      alt: 'TezAI – Yapay Zeka Destekli Akademik Yazım',
    }
  ],
  locale: 'tr_TR',
  type: 'website',
  author: 'TezAI Ekibi',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
}

// Ana sayfa metadata
export const homeMetadata: Metadata = {
  metadataBase: new URL('https://www.tezai.com.tr'),
  title: 'TezAI - Tez Yazım Asistanı | Yapay Zeka Akademik Yazım Aracı',
  description: 'Tez ve akademik yazım sürecinizi hızlandırın! Yapay zeka destekli kaynak formatlama (APA, MLA, Chicago), otomatik özet oluşturma ve kaynak yönetimi. Ücretsiz deneyin.',
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
    title: 'TezAI - Yapay Zeka Destekli Akademik Yazım Aracı',
    description: 'Yapay zeka destekli kaynak formatlama, özet oluşturma ve kaynak yönetimi.',
    url: siteMetadata.url,
    siteName: siteMetadata.siteName,
    images: siteMetadata.images,
    locale: siteMetadata.locale,
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TezAI - Yapay Zeka Destekli Akademik Yazım Aracı',
    description: 'Yapay zeka destekli kaynak formatlama, özet oluşturma ve kaynak yönetimi.',
    images: [siteMetadata.images[0].url],
    creator: '@tezasistani',
    site: '@tezasistani'
  },
  alternates: {
    canonical: siteMetadata.url,
    languages: { 'tr-TR': siteMetadata.url },
  },
  category: 'Eğitim Teknolojisi',
  classification: 'Akademik Yazım Aracı'
}

// Pricing sayfası metadata
export const pricingMetadata: Metadata = {
  title: 'Fiyatlandırma - TezAI | Akademik Yazım Araçları',
  description: 'TezAI kredi paketleri: Ücretsiz başlayın, ihtiyacınıza göre kredi satın alın. Abonelik yok, kredilerin süresi dolmaz.',
  keywords: 'tez asistanı fiyat, akademik yazım aracı fiyat, kaynak formatlama ücreti, tez analiz ücreti, öğrenci akademik araç',
  openGraph: {
    title: 'Fiyatlandırma - TezAI | Akademik Yazım Araçları',
    description: 'Uygun fiyatlı akademik yazım araçları. Ücretsiz başlayın, ihtiyacınıza göre kredi satın alın.',
    url: `${siteMetadata.url}/pricing`,
    images: [{ url: '/og?title=TezAI%20Fiyatland%C4%B1rma&subtitle=Kredi%20Bazl%C4%B1%20Sistem', width: 1200, height: 630, alt: 'TezAI Fiyatlandırma' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fiyatlandırma - TezAI',
    description: 'Uygun fiyatlı akademik yazım araçları. Ücretsiz başlayın, ihtiyacınıza göre kredi satın alın.',
    images: ['/og?title=TezAI%20Fiyatland%C4%B1rma&subtitle=Kredi%20Bazl%C4%B1%20Sistem'],
  },
  alternates: {
    canonical: `${siteMetadata.url}/pricing`,
  }
}

// Auth sayfası metadata
export const authMetadata: Metadata = {
  title: 'Giriş Yap - TezAI | Akademik Yazım Platformu',
  description: 'TezAI\'ye giriş yapın ve yapay zeka destekli akademik yazım araçlarına erişin. Güvenli giriş ve ücretsiz kayıt.',
  keywords: 'tez asistanı giriş, akademik yazım platformu kayıt, üniversite öğrenci girişi',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Giriş Yap - TezAI',
    description: 'Akademik yazım araçlarına erişmek için giriş yapın.',
    url: `${siteMetadata.url}/auth`,
  }
}

// Profile sayfası metadata
export const profileMetadata: Metadata = {
  title: 'Profilim - TezAI | Hesap Yönetimi',
  description: 'TezAI hesap ayarlarınızı yönetin. Kullanım istatistiklerinizi görüntüleyin, kredi satın alın ve kişisel bilgilerinizi güncelleyin.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Profilim - TezAI',
    url: `${siteMetadata.url}/profile`,
  }
}

// Privacy Policy metadata
export const privacyMetadata: Metadata = {
  title: 'Gizlilik Politikası - TezAI | KVKK Uyumlu Veri Koruma',
  description: 'TezAI gizlilik politikası ve veri koruma uygulamaları. KVKK uyumlu veri işleme ve güvenlik önlemleri.',
  keywords: 'tezai gizlilik, kvkk uyumluluk, veri koruma, akademik platform güvenliği, gizlilik politikası',
  openGraph: {
    title: 'Gizlilik Politikası - TezAI',
    description: 'KVKK uyumlu gizlilik uygulamalarımız hakkında bilgi edinin.',
    url: `${siteMetadata.url}/privacy-policy`,
    images: [{ url: '/og?title=Gizlilik%20Politikas%C4%B1&subtitle=KVKK%20Uyumlu%20Veri%20Koruma', width: 1200, height: 630, alt: 'Gizlilik Politikası' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gizlilik Politikası - TezAI',
    description: 'KVKK uyumlu gizlilik uygulamalarımız hakkında bilgi edinin.',
    images: ['/og?title=Gizlilik%20Politikas%C4%B1&subtitle=KVKK%20Uyumlu%20Veri%20Koruma'],
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

// SSS sayfası metadata
export const faqMetadata: Metadata = {
  title: 'SSS - TezAI | Akademik Yazım Yardımı',
  description: 'Sıkça sorulan sorulara cevaplar: nasıl çalışır, fiyatlandırma, kaynak stilleri, güvenlik ve daha fazlası.',
  keywords: 'tezai sss, akademik yazım sss, apa formatı, mla formatı, kaynak yardımı',
  openGraph: {
    title: 'SSS - TezAI',
    description: 'TezAI hakkında sıkça sorulan sorular.',
    url: `${siteMetadata.url}/faq`,
    images: [{ url: '/og?title=SSS&subtitle=TezAI%20Nas%C4%B1l%20%C3%87al%C4%B1%C5%9F%C4%B1r%2C%20Fiyatland%C4%B1rma%2C%20G%C3%BCvenlik', width: 1200, height: 630, alt: 'SSS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSS - TezAI',
    description: 'TezAI hakkında sıkça sorulan sorular.',
    images: ['/og?title=SSS&subtitle=TezAI%20Nas%C4%B1l%20%C3%87al%C4%B1%C5%9F%C4%B1r%2C%20Fiyatland%C4%B1rma%2C%20G%C3%BCvenlik'],
  },
  alternates: {
    canonical: `${siteMetadata.url}/faq`,
  }
}
