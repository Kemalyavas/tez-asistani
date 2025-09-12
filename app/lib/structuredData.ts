// JSON-LD Structured Data for SEO
export const structuredData = {
  // Website Schema
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tez Asistanı",
    "alternateName": "Akademik Yazım Asistanı",
    "url": "https://tez-asistani.vercel.app",
    "description": "AI destekli akademik yazım aracı. Tez, makale ve akademik çalışmalar için kaynak formatı, özet oluşturma ve referans düzenleme.",
    "inLanguage": "tr-TR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tez-asistani.vercel.app/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tez Asistanı",
      "url": "https://tez-asistani.vercel.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://tez-asistani.vercel.app/logo.png",
        "width": "600",
        "height": "60"
      }
    }
  },

  // Organization Schema
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tez Asistanı",
    "legalName": "Tez Asistanı Teknoloji",
    "url": "https://tez-asistani.vercel.app",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tez-asistani.vercel.app/logo.png",
      "width": "600",
      "height": "60"
    },
    "description": "Türkiye'nin en gelişmiş AI destekli akademik yazım platformu",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "Tez Asistanı Kurucuları"
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+90-555-123-4567",
        "contactType": "customer service",
        "availableLanguage": ["Turkish"],
        "areaServed": "TR"
      }
    ],
    "sameAs": [
      "https://twitter.com/tezasistani",
      "https://linkedin.com/company/tez-asistani",
      "https://instagram.com/tezasistani"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TR",
      "addressRegion": "İstanbul"
    }
  },

  // SoftwareApplication Schema
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Tez Asistanı",
    "applicationCategory": "EducationalApplication",
    "applicationSubCategory": "Academic Writing Tool",
    "description": "AI destekli akademik yazım aracı. APA, MLA, Chicago formatlarında otomatik referans oluşturma, özet çıkarma ve tez yazım asistanı.",
    "url": "https://tez-asistani.vercel.app",
    "screenshot": "https://tez-asistani.vercel.app/screenshot.png",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Compatible with Chrome, Firefox, Safari, Edge",
    "softwareVersion": "1.0",
    "dateCreated": "2024-01-01",
    "dateModified": "2024-08-26",
    "author": {
      "@type": "Organization",
      "name": "Tez Asistanı"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Ücretsiz Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "1 thesis analysis, 1 abstract, 5 citation formats",
        "category": "Free Tier"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "9",
        "priceCurrency": "USD",
        "billingDuration": "P1M",
        "description": "30 thesis analyses, 50 abstracts, 100 citation formats, advanced AI",
        "category": "Premium"
      },
      {
        "@type": "Offer",
        "name": "Expert Plan",
        "price": "25",
        "priceCurrency": "USD",
        "billingDuration": "P1M",
        "description": "Unlimited usage, 24/7 support, analytical reports",
        "category": "Enterprise"
      }
    ],
    "featureList": [
      "AI destekli kaynak formatı",
      "APA, MLA, Chicago stil desteği",
      "Otomatik özet oluşturma",
      "PDF ve Word dosya desteği",
      "Çoklu dil desteği",
      "Güvenli veri işleme",
      "7/24 müşteri desteği"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Dr. Ayşe Yılmaz"
        },
        "datePublished": "2024-08-15",
        "reviewBody": "Tez yazım sürecimi inanılmaz hızlandırdı. APA formatındaki referansları otomatik oluşturması çok değerli.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        }
      }
    ]
  },

  // Service Schema
  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Akademik Yazım Hizmetleri",
    "description": "AI destekli akademik yazım, referans formatı, özet oluşturma ve tez yazım asistanı hizmetleri",
    "provider": {
      "@type": "Organization",
      "name": "Tez Asistanı"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Turkey"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://tez-asistani.vercel.app",
      "serviceType": "Online"
    },
    "serviceType": "Educational Technology",
    "category": "Academic Writing",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "25",
      "priceCurrency": "USD",
      "offerCount": "3"
    }
  },

  // FAQ Schema
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Thesis Assistant work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Thesis Assistant uses artificial intelligence technology to analyze your academic texts and automatically generate references in standard formats such as APA, MLA, and Chicago. It can also extract abstracts from your PDF or Word files."
        }
      },
      {
        "@type": "Question",
        "name": "Which citation formats are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support APA 7th Edition, MLA 9th Edition, Chicago 17th Edition, and IEEE formats. Customized formats are also available to meet the requirements of universities worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Evet, tüm verileriniz 256-bit SSL şifreleme ile korunur. KVKK ve GDPR uyumlu veri işleme politikalarımız mevcuttur. Dosyalarınız işlem sonrası güvenli bir şekilde silinir."
        }
      },
      {
        "@type": "Question",
        "name": "Ücretsiz sürümün sınırları neler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ücretsiz sürümde günlük 5 kaynak formatı ve 3 özet oluşturabilirsiniz. Pro planla günlük 50 kaynak formatı ve 25 özete, Expert planla sınırsız kullanıma erişebilirsiniz."
        }
      },
      {
        "@type": "Question",
        "name": "Mobil cihazlarda kullanılabilir mi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Evet, Tez Asistanı tamamen mobil uyumlu bir web uygulamasıdır. Herhangi bir indirme gerektirmez, tüm cihazlarda web tarayıcısı üzerinden kullanılabilir."
        }
      }
    ]
  },

  // HowTo Schema for academic citation
  howTo: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Format Citations in APA Style",
    "description": "Guide to automatic citation formatting in APA style with Thesis Assistant",
    "image": "https://tez-asistani.vercel.app/apa-guide.jpg",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Kaynak metni veya PDF dosyası"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Tez Asistanı web uygulaması"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Giriş yapın",
        "text": "Tez Asistanı'na giriş yapın veya ücretsiz hesap oluşturun"
      },
      {
        "@type": "HowToStep",
        "name": "Kaynağı yükleyin",
        "text": "Formatlamak istediğiniz kaynağın metnini yapıştırın veya PDF dosyasını yükleyin"
      },
      {
        "@type": "HowToStep",
        "name": "Format seçin",
        "text": "APA 7th Edition formatını seçin"
      },
      {
        "@type": "HowToStep",
        "name": "Sonucu alın",
        "text": "AI birkaç saniyede APA formatında mükemmel referans oluşturacak"
      }
    ]
  },

  // BreadcrumbList Schema
  generateBreadcrumb: (items: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
}
