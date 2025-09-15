// JSON-LD Structured Data for SEO (clean, en-US, production domain)
const siteUrl = 'https://www.tezai.com.tr';

export const structuredData = {
  // Website Schema
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TezAI',
    alternateName: 'Thesis Assistant',
    url: siteUrl,
    description:
      'AI-powered academic writing assistant for theses, papers, and research: citation formatting, abstract generation, and reference management.',
    inLanguage: 'en-US',
    // If you add a /search route, update urlTemplate. For now, point to home with q param.
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
    description: 'AI-powered academic writing platform',
    sameAs: [
      'https://x.com/tezasistani',
      // Add more profiles if available (LinkedIn, GitHub, YouTube)
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
      'AI-powered tool for APA/MLA/Chicago citations, abstract generation, and thesis assistance.',
    url: siteUrl,
    image: `${siteUrl}/logo.png`,
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Works in modern browsers.',
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'TezAI',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '9',
        priceCurrency: 'USD',
        category: 'Subscription',
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Expert Plan',
        price: '25',
        priceCurrency: 'USD',
        category: 'Subscription',
        url: `${siteUrl}/pricing`,
      },
    ],
  },

  // FAQPage Schema (embedded questions used sitewide)
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does TezAI work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'TezAI analyzes your academic texts and automatically creates citations in APA, MLA, or Chicago. It can also generate abstracts from your PDF or Word files.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which citation formats are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'We support APA 7th Edition, MLA 9th Edition, Chicago 17th Edition, and IEEE. Custom formats are available to meet various university requirements.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. All data is transmitted over HTTPS. We follow GDPR-compliant practices and securely delete files after processing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. You can try TezAI for free with limited daily usage. Paid plans increase limits and unlock advanced features.',
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

