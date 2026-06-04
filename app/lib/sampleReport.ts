// ============================================================================
// Landing "Raporun böyle görünür" vitrini için ÖRNEK (anonim) analiz çıktısı.
// PremiumResultDisplay'in beklediği şemaya birebir uyar. Gerçek bir teze ait
// DEĞİLDİR — jenerik, temsili bir empirik yüksek lisans tezi örneğidir.
// documentId verilmez → geri bildirim butonu görünmez (vitrinde gerekmez).
// ============================================================================
export const SAMPLE_REPORT = {
  overallScore: 84,
  grade: { letter: 'B+', label: 'Ortanın Üstü', color: '#F59E0B' },
  studyType: 'empirical',
  likelyPartialUpload: false,

  sections: {
    structure: {
      score: 92,
      strengths: ['Bölümler YÖK sırasına uygun', 'İçindekiler ve sayfa numaraları tutarlı'],
      improvements: [],
    },
    formatting: {
      score: 95,
      strengths: ['Kenar boşlukları, yazı tipi ve satır aralığı standartlara uygun'],
      improvements: [],
    },
    introduction: {
      score: 70,
      strengths: [],
      improvements: ['Araştırma sorusu tek ve net bir cümleyle ifade edilmeli'],
    },
    literature: {
      score: 88,
      strengths: ['Güncel ve yeterli sayıda kaynak', 'Konu alanı kapsamlı taranmış'],
      improvements: [],
    },
    methodology: {
      score: 82,
      strengths: ['Örneklem ve veri toplama aracı açıkça tanımlı'],
      improvements: ['Ölçeğin geçerlik–güvenirlik değerleri raporlanmalı'],
    },
    findings: {
      score: 90,
      strengths: ['Bulgular tablo ve şekillerle net sunulmuş'],
      improvements: [],
    },
    discussion: {
      score: 66,
      strengths: [],
      improvements: ['Bulgular literatürdeki önceki çalışmalarla karşılaştırılmalı'],
    },
    conclusion: {
      score: 72,
      strengths: [],
      improvements: ['Ayrı bir "Gelecek Çalışmalar İçin Öneriler" alt başlığı eklenmeli'],
    },
    originality: {
      score: 80,
      strengths: ['Özgün bir örneklem ve güncel bir problem üzerinde çalışılmış'],
      improvements: [],
    },
    writingQuality: {
      score: 86,
      strengths: ['Akademik dil ve terminoloji tutarlı'],
      improvements: [],
    },
  },

  issues: {
    critical: [],
    major: [
      {
        title: 'Araştırma sorusu net olarak belirtilmemiş',
        pageNumber: 8,
        description:
          'Çalışmanın amacı giriş bölümünde paragraf içinde geçiyor, ancak tek ve net bir araştırma sorusu veya test edilebilir hipotez cümlesi bulunmuyor.',
        originalText:
          'Bu çalışmada işletmelerin dijitalleşme süreçleri ve bu süreçlerin firma performansına etkileri ele alınmıştır.',
        actionHint:
          'Giriş bölümünün sonuna "Bu çalışma şu soruya yanıt arar: …" biçiminde tek ve net bir araştırma sorusu/hipotez cümlesi ekleyin.',
        suggestion: 'Araştırma sorusu/sorularına veya test edilebilir hipoteze açıkça yer verilmiş olmalı.',
      },
      {
        title: 'Bulgular literatürle karşılaştırılmamış',
        pageNumber: 41,
        description:
          'Tartışma bölümü ağırlıklı olarak bulguların sayısal özetini içeriyor; elde edilen sonuçların literatürdeki önceki çalışmalarla benzerlik ve farkları tartışılmamış.',
        originalText:
          'Elde edilen sonuçlar, dijitalleşme düzeyinin firma performansını anlamlı biçimde artırdığını göstermektedir.',
        actionHint:
          'Bulgularınızı, literatür taramasında andığınız en az 2–3 çalışmanın sonuçlarıyla doğrudan karşılaştırın; nerede örtüştüğünü, nerede ayrıştığını yazın.',
        suggestion: 'Bulgular önceki çalışmalarla karşılaştırılmış; benzerlik ve farklar açıkça tartışılmış olmalı.',
      },
    ],
    minor: [
      {
        title: 'Gelecek çalışma önerileri eksik',
        pageNumber: 46,
        description:
          'Sonuç bölümünde çalışmanın sınırlılıkları kısaca geçiyor, ancak ayrı bir "Gelecek Çalışmalar" başlığı ve somut öneriler yer almıyor.',
        actionHint:
          'Sonuç bölümünün sonuna kısa bir "Gelecek çalışmalar için öneriler" alt başlığı ekleyip 2–3 somut araştırma yönü belirtin.',
        suggestion: 'Sonuç bölümünde gelecek çalışmalara dair öneriler sunulmuş olmalı.',
      },
    ],
    formatting: [],
  },

  strengths: [
    'Güçlü ve standartlara uygun yapısal organizasyon',
    'Güncel ve yeterli literatür taraması',
    'Bulguların tablo/şekillerle net sunumu',
    'Tutarlı akademik dil ve biçim',
  ],

  statistics: {
    pageCount: 78,
    wordCount: 14500,
    referenceCount: 52,
    figureCount: 9,
    tableCount: 14,
  },

  yokCompliance: {
    score: 90,
    compliant: ['Kapak ve onay sayfaları eksiksiz', 'Türkçe ve İngilizce özet mevcut', 'Kaynakça stili tutarlı'],
    nonCompliant: ['Ayrı "Gelecek Çalışmalar" başlığı yok'],
  },
};
