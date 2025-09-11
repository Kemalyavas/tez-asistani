// app/lib/pricing.ts
// Merkezi fiyat yapılandırma dosyası

// Planların temel bilgileri
export const PRICE_CONFIG = {
  pro: {
    monthly: 299,
    yearly: 2870, // 299 * 12 * 0.8 = ~2870 (%20 indirimli)
    name: 'Pro Plan',
    features: [
      '30 tez analizi',
      '50 özet oluşturma', 
      '100 kaynak formatlama',
      'Gelişmiş AI modelleri',
      'Hızlı e-posta desteği',
      'Detaylı kullanım raporları',
      'Çoklu format desteği (APA, MLA, Chicago, IEEE)'
    ]
  },
  expert: {
    monthly: 699,
    yearly: 6710, // 699 * 12 * 0.8 = ~6710 (%20 indirimli)
    name: 'Expert Plan',
    features: [
      'Sınırsız tez analizi',
      'Sınırsız özet oluşturma',
      'Sınırsız kaynak formatlama',
      'En gelişmiş AI modelleri',
      'Türkçe ve İngilizce özet desteği',
      '7/24 öncelikli destek',
      'Özel kullanıcı yönetimi',
      'Detaylı analitik raporlar'
    ]
  }
};

// Puan limitleri
export const USAGE_LIMITS = {
  free: { 
    thesis_analyses: 1,
    abstracts: 1,
    citations: 5
  },
  pro: { 
    thesis_analyses: 30,
    abstracts: 50,
    citations: 100
  },
  expert: { 
    thesis_analyses: -1, // sınırsız
    abstracts: -1, // sınırsız
    citations: -1 // sınırsız
  }
};

// Yardımcı fonksiyonlar
export const getFormattedPrice = (planId: string, billingCycle: 'monthly' | 'yearly'): string => {
  if (planId === 'free') return '0';
  return PRICE_CONFIG[planId as keyof typeof PRICE_CONFIG][billingCycle].toString();
};

export const getPriceWithCurrency = (price: number): string => {
  return `${price} ₺`;
};

export const getYearlySavings = (planId: string): number => {
  if (planId === 'free') return 0;
  const plan = PRICE_CONFIG[planId as keyof typeof PRICE_CONFIG];
  return Math.round(plan.monthly * 12 - plan.yearly);
};
