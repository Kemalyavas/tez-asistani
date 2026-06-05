// JSON-LD Structured Data for SEO (Turkish, production domain)
import { SITE_URL } from './site';
const siteUrl = SITE_URL;

export const structuredData = {
  // Website Schema
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TezAI',
    alternateName: 'Tez Asistanı',
    url: siteUrl,
    description:
      'Yapay zeka destekli akademik yazım asistanı: tez analizi, atıf biçimlendirme (APA, MLA, Chicago), özet oluşturma ve kaynak yönetimi.',
    inLanguage: 'tr-TR',
    // NOT: SearchAction kaldırıldı — site içi arama motoru yok; çalışmayan bir
    // SearchAction Google'a yanlış sinyal verir (kaldırmak doğru).
    publisher: {
      '@type': 'Organization',
      name: 'TezAI',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
    },
  },

  // Organization Schema
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TezAI',
    legalName: 'TezAI Technology',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
      width: 600,
      height: 60,
    },
    description: 'Yapay zeka destekli akademik yazım platformu',
    sameAs: [
      'https://x.com/tezasistani',
    ],
    foundingDate: '2024',
    // NOT: founders kaldırıldı — "TezAI Team" gerçek bir kişi adı değil; schema'da
    // sahte Person yerine hiç koymamak doğru. Gerçek kurucu adı eklenirse E-E-A-T artar.
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressRegion: 'Kocaeli',
      addressLocality: 'İzmit',
    },
  },

  // SoftwareApplication Schema
  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TezAI',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Academic Writing Tool',
    description:
      'Yapay zeka destekli APA/MLA/Chicago atıf biçimlendirme, özet oluşturma ve tez analizi aracı.',
    url: siteUrl,
    image: `${siteUrl}/logo.png`,
    operatingSystem: 'Web',
    browserRequirements: 'JavaScript gerektirir. Modern tarayıcılarda çalışır.',
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'TezAI',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Paket',
        price: '149',
        priceCurrency: 'TRY',
        category: 'Credits',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Standart Paket',
        price: '449',
        priceCurrency: 'TRY',
        category: 'Credits',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Pro Paket',
        price: '749',
        priceCurrency: 'TRY',
        category: 'Credits',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Ultimate Paket',
        price: '1499',
        priceCurrency: 'TRY',
        category: 'Credits',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/pricing`,
      },
    ],
  },

  // FAQPage Schema — ana sayfadaki görünür SSS bölümüyle birebir eşleşir
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Başlamak için kredi kartı gerekiyor mu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Hayır. Kayıt olunca anında 10 ücretsiz kredi kazanırsın. Bu, tam bir tez analizi veya birden fazla kaynak ve özet için yeterli. Kredi kartı gerekmez.',
        },
      },
      {
        '@type': 'Question',
        name: 'Krediler sona erer mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Hayır, kredilerin asla sona ermez. Bir kez satın al, ihtiyaç duyduğunda kullan. Aylık ücret, abonelik veya baskı yoktur.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hangi kredi paketini seçmeliyim?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Tek bir tez için Starter veya Standart paket genellikle yeterli. Birden fazla proje üzerinde çalışıyorsan veya en iyi değeri istiyorsan, Pro paketi 500 kredi sunar.',
        },
      },
      {
        '@type': 'Question',
        name: 'Tezim güvende mi? Gizliliğim korunuyor mu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Evet. Yüklenen tez dosyaların diğer kullanıcılarla asla paylaşılmaz, analiz sonrası otomatik olarak silinir, yapay zeka modellerini eğitmek için kullanılmaz ve SSL şifrelemesiyle korunur. KVKK ve GDPR uyumludur.',
        },
      },
    ],
  },

  // Helper to generate BreadcrumbList dynamically
  generateBreadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};
