// JSON-LD Structured Data for SEO (Turkish, production domain)
const siteUrl = 'https://www.tezai.com.tr';

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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TezAI',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: '600',
        height: '60',
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
      width: '600',
      height: '60',
    },
    description: 'Yapay zeka destekli akademik yazım platformu',
    sameAs: [
      'https://x.com/tezasistani',
    ],
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'TezAI Team',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressRegion: 'Istanbul',
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
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Standart Paket',
        price: '449',
        priceCurrency: 'TRY',
        category: 'Credits',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Pro Paket',
        price: '749',
        priceCurrency: 'TRY',
        category: 'Credits',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Ultimate Paket',
        price: '1499',
        priceCurrency: 'TRY',
        category: 'Credits',
        url: `${siteUrl}/pricing`,
      },
    ],
  },

  // FAQPage Schema
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'TezAI nasıl çalışır?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'TezAI, akademik metinlerinizi analiz ederek otomatik olarak APA, MLA veya Chicago formatında atıflar oluşturur. Ayrıca PDF veya Word dosyalarınızdan özet üretebilir ve tezinizi detaylı olarak analiz edebilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hangi atıf formatları destekleniyor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'APA 7. Baskı, MLA 9. Baskı, Chicago 17. Baskı ve IEEE formatlarını destekliyoruz. Farklı üniversite gereksinimlerini karşılamak için özel formatlar da mevcuttur.',
        },
      },
      {
        '@type': 'Question',
        name: 'Verilerim güvende mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Evet. Tüm veriler HTTPS üzerinden iletilir. KVKK ve GDPR uyumlu uygulamalar izlenir ve dosyalar işlem sonrası güvenli bir şekilde silinir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ücretsiz deneme var mı?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Evet. Kayıt olduğunuzda 10 ücretsiz kredi kazanırsınız. Kredi kartı gerekmez. Abonelik yok, sadece kullandığınız kadar ödersiniz.',
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
