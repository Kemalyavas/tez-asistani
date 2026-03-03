// app/lib/pricing.ts
// ============================================================================
// TezAI Credit-Based Pricing System v3.0
// Multi-Agent Architecture & New Pricing Model
// ============================================================================

// Currency constants
export const CURRENCY_CODE = 'TRY';
export const CURRENCY_SYMBOL = '₺';

// ============================================================================
// CREDIT PACKAGES (Satın alınabilir kredi paketleri)
// ============================================================================
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceUsd: number;
  pricePerCredit: number;
  savings: string;
  description: string;
  popular: boolean;
  features: string[];
}

export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  starter: {
    id: 'starter',
    name: 'Starter Paket',
    credits: 50,
    bonusCredits: 0,
    totalCredits: 50,
    priceUsd: 149,
    pricePerCredit: 2.98,
    savings: '',
    description: 'TezAI\'yi denemek için ideal',
    popular: false,
    features: [
      '50 kredi',
      '~5 atıf biçimlendirme VEYA',
      '~16 özet oluşturma VEYA',
      '~2 temel tez analizi',
      'Süresiz geçerli'
    ]
  },
  standard: {
    id: 'standard',
    name: 'Standart Paket',
    credits: 200,
    bonusCredits: 40,
    totalCredits: 240,
    priceUsd: 449,
    pricePerCredit: 1.87,
    savings: '%20 bonus',
    description: 'Düzenli kullanıcılar için ideal',
    popular: false,
    features: [
      '200 + 40 bonus kredi',
      '~24 özet oluşturma VEYA',
      '~9 standart analiz VEYA',
      '~4 kapsamlı analiz',
      'Süresiz geçerli'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Paket',
    credits: 400,
    bonusCredits: 100,
    totalCredits: 500,
    priceUsd: 749,
    pricePerCredit: 1.50,
    savings: '%25 bonus',
    description: 'Tez yazarları için en iyi değer',
    popular: true,
    features: [
      '400 + 100 bonus kredi',
      '~166 özet oluşturma VEYA',
      '~20 standart analiz VEYA',
      '~10 kapsamlı analiz',
      'Öncelikli işleme',
      'Süresiz geçerli'
    ]
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Paket',
    credits: 1000,
    bonusCredits: 250,
    totalCredits: 1250,
    priceUsd: 1499,
    pricePerCredit: 1.20,
    savings: '%25 bonus',
    description: 'Maksimum değer arayanlar için',
    popular: false,
    features: [
      '1000 + 250 bonus kredi',
      '~416 özet oluşturma VEYA',
      '~50 standart analiz VEYA',
      '~25 kapsamlı analiz',
      'Öncelikli işleme',
      'Premium destek',
      'Süresiz geçerli'
    ]
  }
};

// ============================================================================
// CREDIT COSTS (İşlem başına kredi maliyetleri)
// ============================================================================
export interface CreditCost {
  actionType: string;
  creditsRequired: number;
  description: string;
  category: 'citation' | 'abstract' | 'thesis';
}

export const CREDIT_COSTS: Record<string, CreditCost> = {
  citation_format: {
    actionType: 'citation_format',
    creditsRequired: 1,
    description: 'Atıf biçimlendirme (APA, MLA, Chicago, IEEE)',
    category: 'citation'
  },
  abstract_generate: {
    actionType: 'abstract_generate',
    creditsRequired: 3,
    description: 'Özet üretimi (TR/EN/Her ikisi)',
    category: 'abstract'
  },
  thesis_basic: {
    actionType: 'thesis_basic',
    creditsRequired: 10,
    description: 'Temel analiz (< 50 sayfa) - Yapı ve kaynak kontrolü',
    category: 'thesis'
  },
  thesis_standard: {
    actionType: 'thesis_standard',
    creditsRequired: 25,
    description: 'Standart analiz (50-150 sayfa) - Multi-Agent detaylı analiz',
    category: 'thesis'
  },
  thesis_comprehensive: {
    actionType: 'thesis_comprehensive',
    creditsRequired: 50,
    description: 'Kapsamlı analiz (150+ sayfa) - Çapraz doğrulama dahil',
    category: 'thesis'
  },
  pdf_report: {
    actionType: 'pdf_report',
    creditsRequired: 5,
    description: 'PDF rapor indirme',
    category: 'thesis'
  },
  comparative_analysis: {
    actionType: 'comparative_analysis',
    creditsRequired: 10,
    description: 'Önceki versiyon ile karşılaştırma',
    category: 'thesis'
  },
  revision_tracking: {
    actionType: 'revision_tracking',
    creditsRequired: 15,
    description: 'Revizyon takibi ve öneriler',
    category: 'thesis'
  }
};

// ============================================================================
// THESIS ANALYSIS TIERS (Sayfa sayısına göre analiz tipleri)
// ============================================================================
export interface AnalysisTier {
  id: string;
  name: string;
  minPages: number;
  maxPages: number;
  credits: number;
  features: string[];
}

export const ANALYSIS_TIERS: AnalysisTier[] = [
  {
    id: 'basic',
    name: 'Temel Analiz',
    minPages: 1,
    maxPages: 50,
    credits: 10,
    features: [
      'Yapı ve organizasyon kontrolü',
      'Temel yazım kalitesi analizi',
      'Kaynak formatı kontrolü',
      'Hızlı AI değerlendirmesi (Gemini Flash)',
      'Temel skor ve öneriler'
    ]
  },
  {
    id: 'standard',
    name: 'Standart Analiz',
    minPages: 51,
    maxPages: 100,
    credits: 25,
    features: [
      'Temel Analizin tüm özellikleri',
      'Multi-Agent derinlemesine analiz',
      'Metodoloji değerlendirmesi',
      'Literatür tutarlılığı kontrolü',
      'Argümantasyon analizi',
      'Detaylı kategori puanları',
      'Bölüm bazlı geri bildirim'
    ]
  },
  {
    id: 'comprehensive',
    name: 'Kapsamlı Analiz',
    minPages: 101,
    maxPages: 999,
    credits: 50,
    features: [
      'Standart Analizin tüm özellikleri',
      'Claude ile çapraz doğrulama',
      'Gemini + Claude hibrit değerlendirme',
      'Özgünlük ve katkı analizi',
      'Profesör düzeyinde geri bildirim',
      'Yayın hazırlığı değerlendirmesi',
      'Kalibre edilmiş skorlar',
      'Öncelikli işleme'
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sayfa sayısına göre analiz tipini ve kredi maliyetini belirle
 */
export function getAnalysisTier(pageCount: number): AnalysisTier {
  for (const tier of ANALYSIS_TIERS) {
    if (pageCount >= tier.minPages && pageCount <= tier.maxPages) {
      return tier;
    }
  }
  // Default: comprehensive for very large documents
  return ANALYSIS_TIERS[2];
}

/**
 * İşlem tipine göre kredi maliyetini al
 */
export function getCreditCost(actionType: string): number {
  return CREDIT_COSTS[actionType]?.creditsRequired || 0;
}

/**
 * Kredi paketini ID'ye göre al
 */
export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES[packageId];
}

/**
 * Fiyatı formatla
 */
export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toFixed(2)}`;
}

/**
 * Kredi başına fiyatı formatla
 */
export function formatPricePerCredit(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toFixed(3)}`;
}

/**
 * Tüm paketleri sıralı olarak al
 */
export function getAllPackages(): CreditPackage[] {
  return Object.values(CREDIT_PACKAGES).sort((a, b) => a.priceUsd - b.priceUsd);
}

/**
 * Kullanıcının kredisi yeterli mi kontrol et
 */
export function hasEnoughCredits(userCredits: number, actionType: string): boolean {
  const cost = getCreditCost(actionType);
  return userCredits >= cost;
}

/**
 * Ücretsiz kullanıcılar için başlangıç kredisi
 */
export const FREE_SIGNUP_CREDITS = 10;

/**
 * Referans bonusu (gelecekte kullanılabilir)
 */
export const REFERRAL_BONUS_CREDITS = 5;

// ============================================================================
// END OF CREDIT SYSTEM CONFIGURATION
// ============================================================================
