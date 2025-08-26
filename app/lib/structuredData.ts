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
        "description": "1 tez analizi, 1 özet, 5 kaynak formatı",
        "category": "Free Tier"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "10",
        "priceCurrency": "USD",
        "billingDuration": "P1M",
        "description": "50 tez analizi, 20 özet, 100 kaynak formatı, gelişmiş AI",
        "category": "Premium"
      },
      {
        "@type": "Offer",
        "name": "Expert Plan",
        "price": "25",
        "priceCurrency": "USD",
        "billingDuration": "P1M",
        "description": "Sınırsız kullanım, 7/24 destek, analitik raporlar",
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
        "name": "Tez Asistanı nasıl çalışır?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tez Asistanı, yapay zeka teknolojisi kullanarak akademik metinlerinizi analiz eder ve APA, MLA, Chicago gibi standart formatlarda otomatik referans oluşturur. Ayrıca PDF veya Word dosyalarınızdan özet çıkarabilir."
        }
      },
      {
        "@type": "Question",
        "name": "Hangi referans formatlarını destekliyor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "APA 7th Edition, MLA 9th Edition, Chicago 17th Edition ve IEEE formatlarını destekliyoruz. Türkiye'deki üniversitelerin gereksinimleri doğrultusunda özelleştirilmiş formatlar da mevcuttur."
        }
      },
      {
        "@type": "Question",
        "name": "Verilerim güvenli mi?",
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
    "name": "APA Formatında Kaynak Nasıl Formatlanır",
    "description": "Tez Asistanı ile APA formatında otomatik kaynak formatı oluşturma rehberi",
    "image": "https://tez-asistani.vercel.app/apa-guide.jpg",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "TRY",
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
