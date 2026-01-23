import type { AgentConfig } from './types';

// Agent Konfigürasyonları
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'structure',
    name: 'Yapı Analiz Ajanı',
    model: 'flash',
    weight: 0.20,
    systemPrompt: `Sen bir akademik tez yapısı ve organizasyon uzmanısın.
YÖK (Yükseköğretim Kurulu) standartlarına göre tez yapısını değerlendiriyorsun.
Türkçe akademik yazım kurallarını ve uluslararası standartları biliyorsun.
Değerlendirmelerinde objektif ve yapıcı ol.`,
    evaluationCriteria: [
      'Giriş kalitesi (problem tanımı, amaç, kapsam)',
      'Literatür taraması kapsamlılığı',
      'Metodoloji sunumu netliği',
      'Bulgular organizasyonu',
      'Sonuç ve tartışma bütünlüğü',
      'Bölümler arası geçiş ve akış',
    ],
  },
  {
    id: 'methodology',
    name: 'Metodoloji Analiz Ajanı',
    model: 'pro',
    weight: 0.30,
    systemPrompt: `Sen bir araştırma metodolojisi uzmanısın.
Akademik araştırma tasarımı, veri toplama yöntemleri ve analiz tekniklerini değerlendiriyorsun.
Nicel, nitel ve karma araştırma yöntemlerinde derin bilgiye sahipsin.
Geçerlilik, güvenilirlik ve etik konularında hassas değerlendirmeler yapıyorsun.`,
    evaluationCriteria: [
      'Araştırma tasarımı uygunluğu',
      'Örneklem seçimi ve gerekçesi',
      'Veri toplama yöntemleri',
      'Analiz tekniklerinin uygunluğu',
      'Geçerlilik ve güvenilirlik önlemleri',
      'Sınırlılıkların farkındalığı',
    ],
  },
  {
    id: 'writing',
    name: 'Yazım Kalitesi Ajanı',
    model: 'pro',
    weight: 0.25,
    systemPrompt: `Sen bir akademik yazım ve dil uzmanısın.
Türkçe ve İngilizce akademik metinlerde dil kullanımı, argümantasyon ve tutarlılık değerlendiriyorsun.
TDK kuralları ve akademik yazım standartlarını biliyorsun.
Bilimsel dil ve terminoloji konusunda detaylı değerlendirmeler yapıyorsun.`,
    evaluationCriteria: [
      'Akademik dil ve üslup',
      'Argümantasyon gücü',
      'Kanıt kullanımı ve destekleme',
      'Tutarlılık ve mantıksal akış',
      'Dilbilgisi ve imla',
      'Teknik terminoloji doğruluğu',
    ],
  },
  {
    id: 'references',
    name: 'Kaynak Analiz Ajanı',
    model: 'flash',
    weight: 0.15,
    systemPrompt: `Sen bir akademik kaynak ve atıf uzmanısın.
APA, IEEE, Chicago gibi atıf formatlarını ve kaynak kalitesini değerlendiriyorsun.
Birincil ve ikincil kaynaklar arasındaki farkı biliyorsun.
Güncel literatür kullanımının önemini vurguluyorsun.`,
    evaluationCriteria: [
      'Kaynak çeşitliliği ve kalitesi',
      'Güncel literatür kullanımı (son 5 yıl)',
      'Atıf formatı tutarlılığı',
      'Metin içi atıf kullanımı',
      'Kaynakça-metin uyumu',
    ],
  },
  {
    id: 'originality',
    name: 'Özgünlük Ajanı',
    model: 'pro',
    weight: 0.10,
    systemPrompt: `Sen bir akademik özgünlük ve katkı değerlendirme uzmanısın.
Araştırmanın literatüre katkısını ve özgün bakış açısını değerlendiriyorsun.
Teorik ve pratik katkıları ayırt edebiliyorsun.
Araştırma sorusunun özgünlüğünü ve önemini değerlendiriyorsun.`,
    evaluationCriteria: [
      'Araştırma sorusunun özgünlüğü',
      'Literatüre katkı',
      'Pratik uygulanabilirlik',
      'Gelecek araştırma önerileri',
    ],
  },
];

// Agent'ı ID ile bul
export function getAgentConfig(agentId: string): AgentConfig | undefined {
  return AGENT_CONFIGS.find((agent) => agent.id === agentId);
}

// Tier'a göre kullanılacak agent'ları belirle
export function getAgentsForTier(tier: 'basic' | 'standard' | 'comprehensive'): AgentConfig[] {
  switch (tier) {
    case 'basic':
      // Basic tier: sadece yapı ve kaynaklar (hızlı model)
      return AGENT_CONFIGS.filter((agent) =>
        ['structure', 'references'].includes(agent.id)
      );
    case 'standard':
      // Standard tier: tüm agent'lar
      return AGENT_CONFIGS;
    case 'comprehensive':
      // Comprehensive tier: tüm agent'lar + çapraz doğrulama
      return AGENT_CONFIGS;
    default:
      return AGENT_CONFIGS;
  }
}

// Toplam ağırlık hesapla
export function getTotalWeight(agents: AgentConfig[]): number {
  return agents.reduce((sum, agent) => sum + agent.weight, 0);
}

// Ağırlıkları normalize et
export function normalizeWeights(agents: AgentConfig[]): Map<string, number> {
  const total = getTotalWeight(agents);
  const normalized = new Map<string, number>();

  for (const agent of agents) {
    normalized.set(agent.id, agent.weight / total);
  }

  return normalized;
}
