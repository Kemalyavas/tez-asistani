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
      '~2 kısa tez analizi',
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
      '~9 standart tez analizi VEYA',
      '~4 uzun tez analizi',
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
      '~20 standart tez analizi VEYA',
      '~10 uzun tez analizi',
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
      '~50 standart tez analizi VEYA',
      '~25 uzun tez analizi',
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
    description: 'Tez analizi (1-50 sayfa) - Tam kapsamlı değerlendirme',
    category: 'thesis'
  },
  thesis_standard: {
    actionType: 'thesis_standard',
    creditsRequired: 25,
    description: 'Tez analizi (51-100 sayfa) - Tam kapsamlı değerlendirme',
    category: 'thesis'
  },
  thesis_comprehensive: {
    actionType: 'thesis_comprehensive',
    creditsRequired: 50,
    description: 'Tez analizi (101+ sayfa) - Tam kapsamlı değerlendirme',
    category: 'thesis'
  },
  pdf_report: {
    actionType: 'pdf_report',
    creditsRequired: 0,
    description: 'PDF rapor indirme (ücretsiz)',
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

// NOT (dürüstlük): Üç seviyede de ANALİZ AYNIDIR — aynı model, aynı 50 kriterlik
// rubrik, aynı derinlik. Seviye yalnızca tezin SAYFA HACMİNE göre ücreti belirler
// (uzun tez = daha fazla işlenen içerik = daha fazla kredi). Feature listeleri bu
// yüzden bilinçli olarak aynıdır; eski "Flash/Multi-Agent/Claude çapraz doğrulama"
// metinleri pasif mimariden kalmaydı ve gerçeği yansıtmıyordu.
const FULL_ANALYSIS_FEATURES = [
  '50 kriterlik tam akademik değerlendirme',
  'Yapı, metodoloji, literatür ve kaynak analizi',
  'Sayfa referanslı, kanıta dayalı bulgular',
  'Önceliklendirilmiş düzeltme önerileri',
  'YÖK standartları uyumluluk kontrolü',
  'Ücretsiz PDF rapor',
];

export const ANALYSIS_TIERS: AnalysisTier[] = [
  {
    id: 'basic',
    name: 'Kısa Tez Analizi',
    minPages: 1,
    maxPages: 50,
    credits: 10,
    features: FULL_ANALYSIS_FEATURES
  },
  {
    id: 'standard',
    name: 'Standart Tez Analizi',
    minPages: 51,
    maxPages: 100,
    credits: 25,
    features: FULL_ANALYSIS_FEATURES
  },
  {
    id: 'comprehensive',
    name: 'Uzun Tez Analizi',
    minPages: 101,
    maxPages: 999,
    credits: 50,
    features: FULL_ANALYSIS_FEATURES
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
