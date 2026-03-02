// JSON-LD Structured Data for SEO (tr-TR, production domain)
const siteUrl = 'https://www.tezai.com.tr';

export const structuredData = {
  // Website Schema
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TezAI',
    alternateName: 'Tez Yazım Asistanı',
    url: siteUrl,
    description:
      'Tezler, makaleler ve araştırmalar için yapay zeka destekli akademik yazım asistanı: kaynak formatlama, özet oluşturma ve referans yönetimi.',
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
        name: 'TezAI Ekibi',
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
    applicationSubCategory: 'Akademik Yazım Aracı',
    description:
      'APA/MLA/Chicago kaynak formatlama, özet oluşturma ve tez analizi için yapay zeka destekli araç.',
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
        name: 'Starter Paketi',
        price: '5',
        priceCurrency: 'USD',
        category: 'Kredi Paketi',
        description: '50 kredi',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Standart Paketi',
        price: '15',
        priceCurrency: 'USD',
        category: 'Kredi Paketi',
        description: '200 + 40 bonus kredi',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Pro Paketi',
        price: '35',
        priceCurrency: 'USD',
        category: 'Kredi Paketi',
        description: '500 + 100 bonus kredi',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Ultimate Paketi',
        price: '75',
        priceCurrency: 'USD',
        category: 'Kredi Paketi',
        description: '1200 + 300 bonus kredi',
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
            'TezAI akademik metinlerinizi analiz eder ve APA, MLA veya Chicago formatında otomatik kaynak oluşturur. Ayrıca PDF veya Word dosyalarınızdan özet üretebilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hangi kaynak formatları destekleniyor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'APA 7. Baskı, MLA 9. Baskı, Chicago 17. Baskı ve IEEE desteklenmektedir. Farklı üniversite gereksinimlerini karşılamak için özel formatlar da mevcuttur.',
        },
      },
      {
        '@type': 'Question',
        name: 'Verilerim güvende mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Evet. Tüm veriler HTTPS üzerinden iletilir. KVKK uyumlu uygulamaları takip eder ve dosyaları işlem sonrasında güvenli bir şekilde sileriz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ücretsiz deneme var mı?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Evet. Yeni kullanıcılar kayıt olduğunda 10 ücretsiz kredi alır. Kredi kartı gerekmez. İhtiyacınıza göre ek kredi paketleri satın alabilirsiniz.',
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
