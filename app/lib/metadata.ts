import type { Metadata } from 'next'
import {
  SITE_URL,
  SITE_NAME,
  SITE_LOCALE,
  TWITTER_HANDLE,
  absoluteUrl,
  ogImageUrl,
} from './site'

// Robots direktifleri
const ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, nofollow'

// Birincil Türkçe anahtar kelimeler (Türkiye pazarı)
const PRIMARY_KEYWORDS = [
  'tez analizi',
  'yapay zeka tez',
  'akademik yazım asistanı',
  'apa kaynakça oluşturucu',
  'mla kaynak gösterme',
  'chicago kaynakça',
  'ieee kaynakça',
  'atıf oluşturucu',
  'otomatik kaynakça',
  'özet oluşturma',
  'tez özeti',
  'tez kontrol',
]

// Geriye dönük uyumluluk için temel site bilgisi
export const siteMetadata = {
  title: 'TezAI – Yapay Zeka Tez Analizi ve Akademik Yazım Asistanı',
  description:
    'Yapay zeka ile tez analizi, otomatik kaynakça (APA, MLA, Chicago, IEEE) ve özet oluşturma. Tezini jüri standartlarına göre kontrol et.',
  keywords: PRIMARY_KEYWORDS,
  url: SITE_URL,
  siteName: SITE_NAME,
  locale: SITE_LOCALE,
  author: 'TezAI Ekibi',
  robots: ROBOTS_INDEX,
}

// ---------------------------------------------------------------------------
// Sayfa metadata üretici — her sayfaya canonical + OG + Twitter kartı garanti
// ---------------------------------------------------------------------------
interface PageMetaInput {
  title: string // şablonsuz başlık; kök "%s | TezAI" şablonunu ekler
  description: string
  path: string // örn. '/pricing'
  keywords?: string
  ogTitle?: string
  ogSubtitle?: string
  index?: boolean // false → noindex, nofollow
  type?: 'website' | 'article'
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  ogTitle,
  ogSubtitle,
  index = true,
  type = 'website',
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path)
  const image = ogImageUrl(ogTitle ?? title, ogSubtitle)

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    robots: index ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    alternates: index ? { canonical: url } : undefined,
    openGraph: {
      title: ogTitle ?? title,
      description,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle ?? title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle ?? title,
      description,
      images: [image],
      creator: TWITTER_HANDLE,
      site: TWITTER_HANDLE,
    },
  }
}

// ---------------------------------------------------------------------------
// Ana sayfa (kök layout) metadata — başlık şablonu burada tanımlı
// ---------------------------------------------------------------------------
export const homeMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TezAI – Yapay Zeka Tez Analizi ve Akademik Yazım Asistanı',
    template: '%s | TezAI',
  },
  description:
    'Yapay zeka ile tez analizi, otomatik kaynakça (APA, MLA, Chicago) ve özet oluşturma. Tezini jüri standartlarına göre kontrol et; kayıt olana 10 ücretsiz kredi.',
  keywords: PRIMARY_KEYWORDS.join(', '),
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  publisher: SITE_NAME,
  robots: ROBOTS_INDEX,
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'TezAI – Yapay Zeka Tez Analizi ve Akademik Yazım Asistanı',
    description:
      'Yapay zeka ile tez analizi, otomatik kaynakça (APA, MLA, Chicago) ve özet oluşturma.',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: 'TezAI – Yapay Zeka Tez Asistanı',
      },
    ],
    locale: SITE_LOCALE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TezAI – Yapay Zeka Tez Analizi ve Akademik Yazım Asistanı',
    description:
      'Yapay zeka ile tez analizi, otomatik kaynakça ve özet oluşturma.',
    images: [ogImageUrl()],
    creator: TWITTER_HANDLE,
    site: TWITTER_HANDLE,
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'tr-TR': SITE_URL },
  },
  category: 'Eğitim Teknolojisi',
}

// ---------------------------------------------------------------------------
// Sayfa metadata'ları
// ---------------------------------------------------------------------------
export const pricingMetadata = buildPageMetadata({
  title: 'Fiyatlar – Kredi Paketleri',
  description:
    'TezAI kredi paketleri: Starter ₺149, Standart ₺449, Pro ₺749, Ultimate ₺1499. Abonelik yok, krediler asla sona ermez. Sadece kullandığın kadar öde.',
  path: '/pricing',
  keywords:
    'tezai fiyat, kredi paketi, tez analizi fiyatı, akademik yazım aracı fiyatı, yapay zeka tez asistanı fiyat',
  ogTitle: 'TezAI Fiyatlar',
  ogSubtitle: 'Starter ₺149 • Pro ₺749 • Abonelik yok',
})

export const authMetadata = buildPageMetadata({
  title: 'Giriş Yap',
  description:
    'TezAI hesabına giriş yap veya ücretsiz kayıt ol. Tez analizi, kaynakça ve özet araçlarına anında eriş.',
  path: '/auth',
  index: false,
})

export const profileMetadata = buildPageMetadata({
  title: 'Profilim',
  description: 'TezAI hesap ayarların, kredi bakiyen ve kullanım geçmişin.',
  path: '/profile',
  index: false,
})

export const analysesMetadata = buildPageMetadata({
  title: 'Analizlerim',
  description: 'Geçmiş tez analizlerin ve indirilebilir raporların.',
  path: '/analyses',
  index: false,
})

export const privacyMetadata = buildPageMetadata({
  title: 'Gizlilik Politikası',
  description:
    'TezAI gizlilik politikası: KVKK ve GDPR uyumlu veri işleme. Tez dosyaların SSL ile korunur ve analiz sonrası otomatik silinir.',
  path: '/privacy-policy',
  keywords: 'tezai gizlilik, kvkk, gdpr, veri güvenliği, gizlilik politikası',
  ogTitle: 'Gizlilik Politikası',
  ogSubtitle: 'KVKK & GDPR Uyumlu Veri Koruma',
})

export const deliveryReturnsMetadata = buildPageMetadata({
  title: 'Teslimat ve İade',
  description:
    'TezAI teslimat ve iade politikası. Krediler satın alma sonrası anında hesabına tanımlanır; teknik hata durumunda otomatik iade edilir.',
  path: '/delivery-returns',
  keywords: 'tezai iade, kredi iadesi, teslimat politikası',
})

export const mesafeliMetadata = buildPageMetadata({
  title: 'Mesafeli Satış Sözleşmesi',
  description:
    'TezAI mesafeli satış sözleşmesi. 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında tarafların hak ve yükümlülükleri.',
  path: '/mesafeli-satis-sozlesmesi',
  keywords: 'mesafeli satış sözleşmesi, tüketici hakları, 6502 sayılı kanun',
})

// --- Landing sayfaları (Türkçe, arama niyeti odaklı) ---
export const ozelliklerMetadata = buildPageMetadata({
  title: 'Özellikler – Tez Analizi, Kaynakça ve Özet Araçları',
  description:
    "TezAI'nin yapay zeka destekli özellikleri: tez analizi, otomatik kaynakça (APA, MLA, Chicago, IEEE), özet oluşturma ve akademik format kontrolü.",
  path: '/ozellikler',
  keywords:
    'tezai özellikler, tez analizi aracı, kaynakça oluşturucu, özet oluşturma, akademik format kontrolü',
  ogTitle: 'TezAI Özellikleri',
  ogSubtitle: 'Tez Analizi • Kaynakça • Özet',
})

export const akademikFormatlarMetadata = buildPageMetadata({
  title: 'Akademik Atıf Formatları – APA, MLA, Chicago, IEEE',
  description:
    'APA 7, MLA 9, Chicago 17 ve IEEE formatlarında otomatik kaynakça ve atıf oluştur. Hangi formatın ne zaman kullanıldığını öğren, tek tıkla biçimlendir.',
  path: '/akademik-formatlar',
  keywords:
    'apa kaynakça oluşturucu, mla kaynak gösterme, chicago kaynakça, ieee kaynakça, atıf formatları, kaynakça oluşturma',
  ogTitle: 'Akademik Atıf Formatları',
  ogSubtitle: 'APA • MLA • Chicago • IEEE',
})

export const tezAnaliziMetadata = buildPageMetadata({
  title: 'Yapay Zeka ile Tez Analizi ve Kontrol',
  description:
    'Tezini yapay zeka ile analiz et: yapı, metodoloji, literatür ve kaynak kontrolü. Jüri öncesi eksikleri gör, düzeltme önerileri al. PDF veya DOCX yükle.',
  path: '/tez-analizi',
  keywords:
    'tez analizi, yapay zeka tez kontrol, tez kontrol programı, tez değerlendirme, tez inceleme',
  ogTitle: 'Yapay Zeka ile Tez Analizi',
  ogSubtitle: 'Yapı • Metodoloji • Kaynak Kontrolü',
})

export const universitelereOzelMetadata = buildPageMetadata({
  title: 'Üniversitelere ve Bölümlere Özel Tez Desteği',
  description:
    'Farklı üniversite ve bölüm tez yazım kılavuzlarına uygun analiz ve kaynakça. Lisans, yüksek lisans ve doktora tezleri için yapay zeka desteği.',
  path: '/universitelere-ozel',
  keywords:
    'üniversite tez kılavuzu, yüksek lisans tezi, doktora tezi, lisans bitirme tezi, tez yazım kuralları',
  ogTitle: 'Üniversitelere Özel Tez Desteği',
  ogSubtitle: 'Lisans • Yüksek Lisans • Doktora',
})

export const hakkimizdaMetadata = buildPageMetadata({
  title: 'Hakkımızda',
  description:
    'TezAI; tez yazarlarının akademik metinlerini yapay zeka ile analiz etmesini, kaynakça ve özet oluşturmasını sağlayan Türkiye merkezli bir platformdur.',
  path: '/hakkimizda',
  keywords: 'tezai hakkında, tezai nedir, akademik yazım platformu',
})

export const iletisimMetadata = buildPageMetadata({
  title: 'İletişim',
  description:
    'TezAI ile iletişime geç. Soru, destek ve iş birliği talepleri için e-posta ve iletişim bilgilerimiz.',
  path: '/iletisim',
  keywords: 'tezai iletişim, tezai destek, tezai yardım',
})

export const sssMetadata = buildPageMetadata({
  title: 'Sık Sorulan Sorular',
  description:
    'TezAI hakkında sık sorulan sorular: nasıl çalışır, fiyatlar, atıf formatları, veri güvenliği ve ücretsiz kredi.',
  path: '/sss',
  keywords:
    'tezai sss, tezai nasıl çalışır, tez analizi sss, kaynakça yardım',
})

// ---------------------------------------------------------------------------
// Blog/Makale için dinamik metadata (gelecekteki /blog için hazır)
// ---------------------------------------------------------------------------
export function generateArticleMetadata({
  title,
  description,
  slug,
  publishedTime,
  modifiedTime,
  tags = [],
  author = siteMetadata.author,
  image,
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
  const url = absoluteUrl(`/blog/${slug}`)
  const ogImage = image ?? ogImageUrl(title)

  return {
    title: { absolute: `${title} | TezAI Blog` },
    description,
    keywords: [...tags, ...PRIMARY_KEYWORDS.slice(0, 8)].join(', '),
    authors: [{ name: author }],
    robots: ROBOTS_INDEX,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: SITE_LOCALE,
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
      images: [ogImage],
      creator: TWITTER_HANDLE,
    },
  }
}
