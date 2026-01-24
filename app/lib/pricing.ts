// app/lib/pricing.ts
// ============================================================================
// TezAI Credit-Based Pricing System v3.0
// Multi-Agent Architecture & New Pricing Model
// ============================================================================

// Currency constants
export const CURRENCY_CODE = 'USD';
export const CURRENCY_SYMBOL = '$';

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
    name: 'Starter Pack',
    credits: 50,
    bonusCredits: 0,
    totalCredits: 50,
    priceUsd: 5,
    pricePerCredit: 0.10,
    savings: '',
    description: 'Perfect for trying out TezAI',
    popular: false,
    features: [
      '50 credits',
      '~5 citation formats OR',
      '~16 abstracts OR',
      '~2 basic thesis analyses',
      'Never expires'
    ]
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    credits: 200,
    bonusCredits: 40,
    totalCredits: 240,
    priceUsd: 15,
    pricePerCredit: 0.0625,
    savings: '20% bonus',
    description: 'Great value for regular users',
    popular: false,
    features: [
      '200 + 40 bonus credits',
      '~24 abstracts OR',
      '~9 standard analyses OR',
      '~4 comprehensive analyses',
      'Never expires'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 500,
    bonusCredits: 100,
    totalCredits: 600,
    priceUsd: 35,
    pricePerCredit: 0.058,
    savings: '40% bonus',
    description: 'Best for thesis writers',
    popular: true,
    features: [
      '500 + 100 bonus credits',
      '~60 abstracts OR',
      '~24 standard analyses OR',
      '~12 comprehensive analyses',
      'Priority processing',
      'Never expires'
    ]
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Pack',
    credits: 1200,
    bonusCredits: 300,
    totalCredits: 1500,
    priceUsd: 75,
    pricePerCredit: 0.05,
    savings: '60% bonus',
    description: 'Maximum value for power users',
    popular: false,
    features: [
      '1200 + 300 bonus credits',
      '~150 abstracts OR',
      '~60 standard analyses OR',
      '~30 comprehensive analyses',
      'Priority processing',
      'Premium support',
      'Never expires'
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
