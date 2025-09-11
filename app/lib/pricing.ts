// app/lib/pricing.ts
// Merkezi fiyat yapılandırma dosyası

// Currency constants (USD)
export const CURRENCY_CODE = 'USD';
export const CURRENCY_SYMBOL = '$';

// Core plan info (USD pricing)
export const PRICE_CONFIG = {
  pro: {
    monthly: 9, // $9 monthly
    yearly: 86, // 9 * 12 * 0.8 = 86.4 ≈ 86 (20% discount)
    name: 'Pro Plan',
    features: [
      '30 thesis analyses',
      '50 abstract generations', 
      '100 citation formattings',
      'Advanced AI models',
      'Fast email support',
      'Detailed usage reports',
      'Multiple format support (APA, MLA, Chicago, IEEE)'
    ]
  },
  expert: {
    monthly: 25, // $25 monthly
    yearly: 240, // 25 * 12 * 0.8 = 240 (20% discount)
    name: 'Expert Plan',
    features: [
      'Unlimited thesis analyses',
      'Unlimited abstract generations',
      'Unlimited citation formattings',
      'Premium AI models',
      'English & Turkish abstract support',
      '24/7 priority support',
      'Custom user management',
      'Detailed analytics reports'
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
  return `${CURRENCY_SYMBOL}${price}`;
};

export const getYearlySavings = (planId: string): number => {
  if (planId === 'free') return 0;
  const plan = PRICE_CONFIG[planId as keyof typeof PRICE_CONFIG];
  return Math.round(plan.monthly * 12 - plan.yearly);
};
