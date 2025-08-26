import type { Metadata } from 'next'

// Site ana metadata
export const siteMetadata = {
  title: 'Tez Asistanı - AI Destekli Akademik Yazım Aracı | Türkiye',
  description: 'Tez, makale ve akademik çalışmalarınız için AI destekli kaynak formatı, özet oluşturma ve yazım asistanı. APA, MLA, Chicago stillerinde otomatik referans formatı. Türkiye\'nin en gelişmiş akademik yazım platformu.',
  keywords: [
    // Ana hedef kelimeler
    'tez asistanı', 'akademik yazım', 'tez yazım programı', 'referans formatı',
    'kaynak formatı', 'akademik makale asistanı', 'tez özeti', 'literature review',
    
    // Uzun kuyruk kelimeler
    'apa format türkiye', 'mla format türkçe', 'chicago stil referans',
    'tez kaynakça düzenleme', 'akademik yazım kuralları', 'makale referansı',
    'bibliyografya oluşturma', 'atıf formatı', 'akademik araştırma',
    
    // Türkiye odaklı
    'türkiye tez yazım', 'türk üniversiteleri tez', 'yök tez formatı',
    'üniversite tez kuralları', 'lisansüstü tez', 'doktora tezi yazım',
    'yüksek lisans tezi', 'akademisyen araçları türkiye',
    
    // Teknoloji odaklı
    'ai akademik yazım', 'yapay zeka tez asistanı', 'otomatik referans',
    'akıllı akademik araçlar', 'dijital tez yazım', 'online akademik platform'
  ],
  url: 'https://tez-asistani.vercel.app',
  siteName: 'Tez Asistanı',
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
  title: 'Tez Asistanı - AI Destekli Akademik Yazım Aracı | Türkiye #1',
  description: 'Tez ve akademik çalışmalarınızı hızlandırın! AI destekli kaynak formatı (APA, MLA, Chicago), otomatik özet oluşturma, referans düzenleme. Türkiye\'nin en gelişmiş akademik yazım platformu. Ücretsiz deneyin!',
  keywords: siteMetadata.keywords.join(', '),
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  publisher: siteMetadata.siteName,
  robots: siteMetadata.robots,
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
  title: 'Fiyatlar - Tez Asistanı | Akademik Yazım Araçları Fiyatlandırma',
  description: 'Tez Asistanı fiyat planları: Ücretsiz plan ile başlayın, Pro ve Expert planları ile sınırsız akademik yazım imkanları. Aylık 99₺\'den başlayan fiyatlarla tez yazım sürecinizi hızlandırın.',
  keywords: 'tez asistanı fiyat, akademik yazım araçları fiyat, tez yazım programı ücreti, akademik platform abonelik, üniversite öğrenci indirim',
  openGraph: {
    title: 'Fiyatlar - Tez Asistanı | Akademik Yazım Araçları',
    description: 'Uygun fiyatlı akademik yazım araçları. Ücretsiz plan ile başlayın, Pro planla sınırları kaldırın. Aylık 99₺\'den başlayan fiyatlarla.',
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
