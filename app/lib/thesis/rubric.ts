// app/lib/thesis/rubric.ts
// ============================================================================
// TezAI Locked Rubric v1.0
// ============================================================================
//
// Bu dosya tezleri değerlendirirken kullanılan KİLİTLİ rubric'i tanımlar.
// "Locked" demek: rubric runtime'da değiştirilmez; her analizde aynı kriterler
// uygulanır. Aynı tez = aynı sonuç (deterministik puanlama temeli).
//
// Tasarım kaynakları (kanıtlanabilir):
//   - YÖK Lisansüstü Tez Yazım Kılavuzu (biçimsel kurallar)
//   - Dokuz Eylül Sağlık Bilimleri Tez Değerlendirme Formu (jüri ölçütleri)
//   - NHH Master Thesis Assessment Criteria (uluslararası referans)
//   - LLM Evaluation literatürü (Rulers 2026, AutoSCORE 2025, LLM-RUBRIC 2024)
//
// Yapı:
//   - 10 kategori × ortalama 5 item = 50 item
//   - Her item: id, kategori, başlık, açıklama (AI'a sorulan kriter),
//     evidenceType (binary/objective/subjective), weight (kategori içi 1-5)
//   - Her kategori: id, başlık, açıklama, weight (genel skorda 1-10)
//
// Versiyonlama:
//   RUBRIC_VERSION bump'lanırsa eski cache otomatik invalid olur (analyze/start
//   route'undaki cache lookup rubric_version eşitliği arar).
// ============================================================================

export const RUBRIC_VERSION = '1.0';

// ----------------------------------------------------------------------------
// Tipler
// ----------------------------------------------------------------------------

export type RubricCategoryId =
  | 'format' // 1. Biçimsel kurallar (YÖK)
  | 'structure' // 2. Yapı ve organizasyon
  | 'introduction' // 3. Giriş
  | 'literature' // 4. Literatür taraması
  | 'methodology' // 5. Metodoloji
  | 'findings' // 6. Bulgular
  | 'discussion' // 7. Tartışma
  | 'conclusion' // 8. Sonuç ve öneriler
  | 'originality' // 9. Özgünlük ve katkı
  | 'writing'; // 10. Akademik yazım

/**
 * Item'ın AI tarafından nasıl değerlendirileceğini belirler:
 *   - binary:    Var / yok şeklinde net (ör. "Etik beyan sayfası mevcut").
 *   - objective: Ölçülebilir nitelik (ör. "Kaynakçada APA tutarlılığı").
 *   - subjective: Yargı gerektirir (ör. "Tartışma yeterince derinlikli").
 *
 * Subjective itemlar AI için en zorudur; LLM literatürü (LLM-Rubric 2024)
 * bunları "uncertainty bandlı" raporluyor — biz de cache + bigger evidence
 * ile zayıflatıyoruz ama %100 tutarlılık vaat etmiyoruz.
 */
export type EvidenceType = 'binary' | 'objective' | 'subjective';

/** AI'nın tek bir item için döneceği değer kümesi. */
export type ItemStatus = 'found' | 'partial' | 'not_found' | 'not_applicable';

export interface RubricItem {
  id: string;
  categoryId: RubricCategoryId;
  title: string; // UI'da kısa başlık (Türkçe)
  description: string; // Gemini'ye sorulan kriter — net, ölçülebilir
  evidenceType: EvidenceType;
  weight: number; // Kategori içi göreceli ağırlık (1-5)
}

export interface RubricCategory {
  id: RubricCategoryId;
  title: string; // UI ve rapor başlığı
  description: string; // Kategori amacı (kısa)
  weight: number; // Genel skorda kategori ağırlığı (1-10)
}

// ----------------------------------------------------------------------------
// Kategoriler — toplam ağırlık 50 (kolay normalize edilir)
// Ağırlıkların gerekçesi:
//   - Methodology + Discussion en yüksek (8): tezin bilimsel çekirdeği
//   - Format + Structure orta-yüksek (7): YÖK uyumluluğu kritik
//   - Introduction + Literature + Findings + Writing orta (5)
//   - Conclusion + Originality daha düşük (3-4): kısa ve subjektif
// ----------------------------------------------------------------------------

export const RUBRIC_CATEGORIES: RubricCategory[] = [
  {
    id: 'format',
    title: 'Biçimsel Kurallar',
    description:
      'YÖK Lisansüstü Tez Yazım Kılavuzu uyumluluğu — kapak, etik beyan, özet, sayfa düzeni, kaynakça stili.',
    weight: 7,
  },
  {
    id: 'structure',
    title: 'Yapı ve Organizasyon',
    description: 'Bölüm hiyerarşisi, akıcı geçişler, ekler ve başlık numaralandırması.',
    weight: 7,
  },
  {
    id: 'introduction',
    title: 'Giriş',
    description: 'Problem tanımı, araştırma sorusu, kapsam ve tezin önemi.',
    weight: 5,
  },
  {
    id: 'literature',
    title: 'Literatür Taraması',
    description: 'Kapsamlılık, güncellik, kritik analiz ve literatürdeki boşluğun tespiti.',
    weight: 5,
  },
  {
    id: 'methodology',
    title: 'Metodoloji',
    description:
      'Araştırma deseni, örneklem, veri toplama, istatistiksel testler, sınırlılıklar ve etik onay.',
    weight: 8,
  },
  {
    id: 'findings',
    title: 'Bulgular',
    description: 'Sistematik sunum, tablo/grafik standardı, nesnellik, hipotez testi sonuçları.',
    weight: 5,
  },
  {
    id: 'discussion',
    title: 'Tartışma',
    description:
      'Bulguların literatürle sentezi, beklenmeyen sonuçların açıklanması, derinlik ve anlamlandırma.',
    weight: 8,
  },
  {
    id: 'conclusion',
    title: 'Sonuç ve Öneriler',
    description: 'Hipotezlerle bağlantılı sonuç, gelecek araştırma ve pratik öneriler.',
    weight: 4,
  },
  {
    id: 'originality',
    title: 'Özgünlük ve Katkı',
    description: 'Bilimsel yenilik, yöntem yeniliği veya alana net katkı.',
    weight: 3,
  },
  {
    id: 'writing',
    title: 'Akademik Yazım',
    description: 'Cümle yapısı, terminoloji, imla/dil bilgisi, akademik üslup ve zaman tutarlılığı.',
    weight: 5,
  },
];

// ----------------------------------------------------------------------------
// Item'lar — 50 adet
// Her description AI'a soracak kriter. NET ve ÖLÇÜLEBİLİR yazılmalı:
//   ✓ "Kapak sayfasında üniversite, enstitü, anabilim dalı, başlık,
//      yazar adı ve danışman adı eksiksiz mevcut"
//   ✗ "Kapak iyi olmalı"  (belirsiz, ölçülemez)
// ----------------------------------------------------------------------------

export const RUBRIC_ITEMS: RubricItem[] = [
  // ==========================================================================
  // 1. FORMAT (Biçimsel Kurallar) — 7 item
  // ==========================================================================
  {
    id: 'format-cover-page',
    categoryId: 'format',
    title: 'Kapak Sayfası',
    description:
      'Kapak sayfasında üniversite adı, enstitü, anabilim dalı, tez başlığı, yazar adı, danışman adı ve tarih (ay-yıl) eksiksiz ve YÖK kılavuzuna uygun düzende.',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'format-ethics-declaration',
    categoryId: 'format',
    title: 'Etik Beyan Sayfası',
    description:
      'Etik ilkelere uygunluk beyan sayfası mevcut, yazar tarafından imzalı/imzalanması için yer ayrılmış ve YÖK metnine uygun.',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'format-abstracts-bilingual',
    categoryId: 'format',
    title: 'İki Dilde Özet',
    description:
      'Hem Türkçe ÖZET hem İngilizce ABSTRACT bölümü mevcut, her ikisi de uygun uzunlukta (yaklaşık 150-300 kelime) ve anahtar kelimeler içermekte.',
    evidenceType: 'binary',
    weight: 4,
  },
  {
    id: 'format-toc-complete',
    categoryId: 'format',
    title: 'İçindekiler ve Liste Sayfaları',
    description:
      'İçindekiler, Tablolar Listesi, Şekiller Listesi (varsa Kısaltmalar Listesi) eksiksiz, sayfa numaralı ve gerçek başlıklarla tutarlı.',
    evidenceType: 'binary',
    weight: 4,
  },
  {
    id: 'format-pagination-correct',
    categoryId: 'format',
    title: 'Sayfa Numaralandırma',
    description:
      'Ön sayfalar Roma rakamı (i, ii, iii…), ana metin Arap rakamı (1, 2, 3…) ile numaralandırılmış, kapak sayfasında numara görünmüyor.',
    evidenceType: 'binary',
    weight: 3,
  },
  {
    id: 'format-margins-fonts',
    categoryId: 'format',
    title: 'Sayfa Düzeni (Marj, Font, Aralık)',
    description:
      'Kenar boşlukları YÖK kılavuzuna uygun (genellikle sol 4 cm, üst 4 cm, sağ 2.5 cm, alt 2.5 cm), font Times New Roman/benzeri 11-12 pt, satır aralığı 1.5.',
    evidenceType: 'objective',
    weight: 4,
  },
  {
    id: 'format-references-style',
    categoryId: 'format',
    title: 'Kaynakça Stili Tutarlılığı',
    description:
      'Tüm kaynakça girdileri aynı atıf stili (APA / IEEE / Chicago / MLA) içinde tutarlı; metin içi atıflar aynı stille kaynakçaya bağlanıyor.',
    evidenceType: 'objective',
    weight: 5,
  },

  // ==========================================================================
  // 2. STRUCTURE (Yapı ve Organizasyon) — 4 item
  // ==========================================================================
  {
    id: 'structure-hierarchy-logical',
    categoryId: 'structure',
    title: 'Bölüm Hiyerarşisi',
    description:
      'Tez, akademik standart yapıyı izliyor: Giriş → Literatür → Yöntem → Bulgular → Tartışma → Sonuç. Sapma varsa bilimsel olarak gerekçeli.',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'structure-section-flow',
    categoryId: 'structure',
    title: 'Bölüm Geçişlerinin Akıcılığı',
    description:
      'Bölümler arası geçişler mantıklı; her bölüm bir öncekine dayanıyor ve bir sonrakine zemin hazırlıyor.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'structure-headings-numbered',
    categoryId: 'structure',
    title: 'Başlık Numaralandırması',
    description:
      'Başlıklar tutarlı şekilde numaralı (1, 1.1, 1.1.1) ve YÖK derinlik sınırını (genellikle 3-4 seviye) aşmıyor.',
    evidenceType: 'objective',
    weight: 3,
  },
  {
    id: 'structure-appendix-usage',
    categoryId: 'structure',
    title: 'Ekler ve Aşırı Detay Yönetimi',
    description:
      'Aşırı uzun tablo/anket/ham veri ana metinde değil Ekler bölümünde; metin akıcılığı korunuyor.',
    evidenceType: 'subjective',
    weight: 3,
  },

  // ==========================================================================
  // 3. INTRODUCTION (Giriş) — 5 item
  // ==========================================================================
  {
    id: 'intro-problem-defined',
    categoryId: 'introduction',
    title: 'Problem Tanımı',
    description:
      'Araştırılan problem net, somut ve okuyucunun konuya yabancı olsa bile anlayabileceği şekilde tanımlanmış.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'intro-research-question',
    categoryId: 'introduction',
    title: 'Araştırma Sorusu / Hipotez',
    description:
      'Araştırma sorusu/sorularına veya test edilebilir hipoteze açıkça yer verilmiş ("Bu çalışma şu soruya cevap arıyor: …").',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'intro-significance',
    categoryId: 'introduction',
    title: 'Tezin Önemi',
    description:
      'Tezin neden önemli olduğu, hangi soruna çözüm/katkı sağladığı somut olarak gerekçelendirilmiş.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'intro-scope-limits',
    categoryId: 'introduction',
    title: 'Kapsam ve Sınırlılıklar',
    description:
      'Tezin kapsamı net çizilmiş; neyin dahil edildiği/edilmediği ve sınırlılıklar belirtilmiş.',
    evidenceType: 'objective',
    weight: 3,
  },
  {
    id: 'intro-thesis-outline',
    categoryId: 'introduction',
    title: 'Tezin Yapısının Tanıtımı',
    description:
      'Giriş sonunda tezin sonraki bölümlerinin akışı kısaca tanıtılmış (yapı haritası).',
    evidenceType: 'binary',
    weight: 2,
  },

  // ==========================================================================
  // 4. LITERATURE (Literatür Taraması) — 5 item
  // ==========================================================================
  {
    id: 'lit-comprehensive',
    categoryId: 'literature',
    title: 'Kapsamlılık',
    description:
      'Alanın temel/kurucu kaynakları ve ana otoriteleri taramada yer alıyor; yüzeysel değil.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'lit-recent-sources',
    categoryId: 'literature',
    title: 'Güncellik',
    description:
      'Son 5 yıla ait güncel makale/araştırma yeterli oranda (kabaca %30+) bulunuyor; kaynaklar sadece eski değil.',
    evidenceType: 'objective',
    weight: 4,
  },
  {
    id: 'lit-critical-analysis',
    categoryId: 'literature',
    title: 'Kritik Analiz',
    description:
      'Kaynaklar sadece tarif edilmemiş; karşılaştırılmış, eleştirilmiş, çelişkiler tartışılmış.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'lit-gap-identified',
    categoryId: 'literature',
    title: 'Literatürdeki Boşluk',
    description:
      'Tezin doldurduğu bilimsel boşluk net olarak ortaya konmuş ("Bu konu literatürde şu açıdan eksik kalmıştır").',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'lit-international-sources',
    categoryId: 'literature',
    title: 'Uluslararası Kaynaklar',
    description:
      'Türkçe kaynaklar yanında İngilizce/uluslararası akademik kaynaklara yeterli yer verilmiş.',
    evidenceType: 'objective',
    weight: 3,
  },

  // ==========================================================================
  // 5. METHODOLOGY (Metodoloji) — 7 item (en ağır kategori)
  // ==========================================================================
  {
    id: 'method-design-justified',
    categoryId: 'methodology',
    title: 'Araştırma Deseni Gerekçesi',
    description:
      'Seçilen araştırma deseni (nicel/nitel/karma; deneysel/betimsel/nedensel-karşılaştırmalı) açıkça belirtilmiş ve neden seçildiği gerekçelendirilmiş.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'method-sample-defined',
    categoryId: 'methodology',
    title: 'Örneklem ve Evren',
    description:
      'Evren ve örneklem net tanımlanmış; örneklem büyüklüğü, seçim yöntemi (rastgele/amaçlı/kümeleme) ve gerekçesi belirtilmiş.',
    evidenceType: 'objective',
    weight: 5,
  },
  {
    id: 'method-data-collection',
    categoryId: 'methodology',
    title: 'Veri Toplama Yöntemi',
    description:
      'Veri toplama aracı (anket/görüşme/ölçek/gözlem) ve süreci ayrıntılı anlatılmış; başkasının tekrarlayabileceği netlikte.',
    evidenceType: 'objective',
    weight: 5,
  },
  {
    id: 'method-statistical-tests',
    categoryId: 'methodology',
    title: 'İstatistiksel Anlamlılık Testleri',
    description:
      'Karşılaştırma içeren nicel çalışmalarda uygun istatistiksel test (t-testi, ANOVA, χ², regresyon) yapılmış ve p değerleri raporlanmış. Sadece betimsel istatistik (ortalama/yüzde) yetersizdir.',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'method-validity-reliability',
    categoryId: 'methodology',
    title: 'Geçerlilik ve Güvenilirlik',
    description:
      "Veri toplama aracının geçerliliği ve güvenilirliği tartışılmış (Cronbach's α, faktör analizi, pilot çalışma vb.).",
    evidenceType: 'objective',
    weight: 4,
  },
  {
    id: 'method-limitations',
    categoryId: 'methodology',
    title: 'Sınırlılıklar',
    description:
      'Çalışmanın sınırlılıkları ("Sınırlılıklar" başlığı altında) açıkça belirtilmiş; genelleme sınırları net.',
    evidenceType: 'binary',
    weight: 3,
  },
  {
    id: 'method-ethics-approval',
    categoryId: 'methodology',
    title: 'Etik Kurul Onayı',
    description:
      'İnsan veya hayvan deneği içeren çalışmalarda etik kurul onayı (karar numarası, tarih) belirtilmiş. İnsan/hayvan deneği yoksa "not_applicable".',
    evidenceType: 'binary',
    weight: 4,
  },

  // ==========================================================================
  // 6. FINDINGS (Bulgular) — 5 item
  // ==========================================================================
  {
    id: 'findings-systematic',
    categoryId: 'findings',
    title: 'Sistematik Sunum',
    description:
      'Bulgular araştırma soruları/hipotezlerinin sırasına göre sistematik sunulmuş; karışık değil.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'findings-tables-graphs',
    categoryId: 'findings',
    title: 'Tablo ve Grafik Standardı',
    description:
      'Tablo/grafikler APA standardına uygun (numaralı, başlıklı, eksen etiketli, kaynak belirtilmiş). Şekil ve Grafik numaralandırması ardışık.',
    evidenceType: 'objective',
    weight: 5,
  },
  {
    id: 'findings-objective',
    categoryId: 'findings',
    title: 'Nesnellik',
    description:
      "Bulgular bölümünde sadece veri sunulmuş; yorum (Tartışma'ya ait) bulgu içine karıştırılmamış.",
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'findings-hypothesis-test',
    categoryId: 'findings',
    title: 'Hipotez Testi Sonuçları',
    description:
      'Her hipoteze yönelik bulgu net belirtilmiş ("H1 desteklendi/reddedildi") ve istatistiksel sonuç (test değeri, p) gösterilmiş.',
    evidenceType: 'binary',
    weight: 4,
  },
  {
    id: 'findings-no-redundancy',
    categoryId: 'findings',
    title: 'Tekrarsızlık',
    description:
      'Aynı veri hem tablo hem grafik hem metinde aşırı tekrarlanmamış; sunum ekonomik.',
    evidenceType: 'subjective',
    weight: 3,
  },

  // ==========================================================================
  // 7. DISCUSSION (Tartışma) — 5 item
  // ==========================================================================
  {
    id: 'discuss-literature-sync',
    categoryId: 'discussion',
    title: 'Bulgu-Literatür Sentezi',
    description:
      'Bulgular literatürdeki önceki çalışmalarla karşılaştırılmış; benzerlik ve farklar açıkça tartışılmış.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'discuss-unexpected',
    categoryId: 'discussion',
    title: 'Beklenmeyen Sonuçların Açıklanması',
    description:
      'Hipotezi desteklemeyen veya beklenmeyen sonuçlar görmezden gelinmemiş; olası nedenler tartışılmış.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'discuss-generalization',
    categoryId: 'discussion',
    title: 'Genelleme Sınırları',
    description:
      'Bulguların hangi bağlamda genellenebileceği, hangilerinde genellenemeyeceği açık ve dürüstçe belirtilmiş.',
    evidenceType: 'subjective',
    weight: 3,
  },
  {
    id: 'discuss-implications',
    categoryId: 'discussion',
    title: 'Pratik ve Teorik Anlamlandırma',
    description:
      'Bulguların alana, uygulamaya ve teoriye katkısı somut olarak yorumlanmış.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'discuss-depth',
    categoryId: 'discussion',
    title: 'Tartışma Derinliği',
    description:
      "Tartışma bölümü Bulgular'ın özet tekrarı değil; derinlikli analiz, neden-sonuç ilişkisi ve alternatif açıklamalar içeriyor.",
    evidenceType: 'subjective',
    weight: 5,
  },

  // ==========================================================================
  // 8. CONCLUSION (Sonuç ve Öneriler) — 4 item
  // ==========================================================================
  {
    id: 'conclude-hypothesis-link',
    categoryId: 'conclusion',
    title: 'Hipotezlerle Bağlantılı Sonuç',
    description:
      'Sonuç bölümü araştırma sorusu/hipotezlerine doğrudan cevap veriyor; bağlantı net.',
    evidenceType: 'binary',
    weight: 5,
  },
  {
    id: 'conclude-future-research',
    categoryId: 'conclusion',
    title: 'Gelecek Araştırma Önerileri',
    description:
      'Tezin açtığı yeni araştırma yönleri ve gelecek çalışmalar için öneriler somut olarak verilmiş.',
    evidenceType: 'binary',
    weight: 3,
  },
  {
    id: 'conclude-practical',
    categoryId: 'conclusion',
    title: 'Pratik Öneriler',
    description:
      'Uygulamaya yönelik somut öneriler (politika yapıcılara, sektöre, eğitimcilere vb.) verilmiş. Sadece teorik tezlerde "not_applicable".',
    evidenceType: 'subjective',
    weight: 3,
  },
  {
    id: 'conclude-not-restate',
    categoryId: 'conclusion',
    title: 'Bulguların Sentezi (Tekrar Değil)',
    description:
      "Sonuç bölümü Bulgular'ın aynısını tekrarlamıyor; bütünleştirici bir sentez sunuyor.",
    evidenceType: 'subjective',
    weight: 3,
  },

  // ==========================================================================
  // 9. ORIGINALITY (Özgünlük ve Katkı) — 3 item
  // ==========================================================================
  {
    id: 'orig-scientific-novelty',
    categoryId: 'originality',
    title: 'Bilimsel Yenilik',
    description:
      'Tezde alan için yeni bir kavram, model, çerçeve veya bulgu sunulmuş.',
    evidenceType: 'subjective',
    weight: 5,
  },
  {
    id: 'orig-method-novelty',
    categoryId: 'originality',
    title: 'Yöntem Yeniliği veya Adaptasyonu',
    description:
      'Yeni bir yöntem geliştirilmiş veya bilinen bir yöntem yeni bir alana/konuya uygulanmış.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'orig-field-contribution',
    categoryId: 'originality',
    title: 'Alana Katkı',
    description:
      'Tezin alana spesifik katkısı (boşluğu doldurma, yeni veri seti, yeni perspektif) net olarak ifade edilmiş.',
    evidenceType: 'subjective',
    weight: 4,
  },

  // ==========================================================================
  // 10. WRITING (Akademik Yazım) — 5 item
  // ==========================================================================
  {
    id: 'write-sentence-quality',
    categoryId: 'writing',
    title: 'Cümle Yapısı',
    description:
      'Cümleler düzgün kurulmuş; uzun-karmaşık cümleler aşırıya kaçmamış; paragraf geçişleri akıcı.',
    evidenceType: 'subjective',
    weight: 4,
  },
  {
    id: 'write-terminology',
    categoryId: 'writing',
    title: 'Terminoloji',
    description:
      'Alan terminolojisi doğru ve tutarlı kullanılmış; aynı kavram için farklı terim karışıklığı yok.',
    evidenceType: 'objective',
    weight: 4,
  },
  {
    id: 'write-grammar-spelling',
    categoryId: 'writing',
    title: 'İmla ve Dil Bilgisi',
    description:
      'İmla, noktalama ve dil bilgisi hataları minimal düzeyde (en fazla birkaç typo).',
    evidenceType: 'objective',
    weight: 3,
  },
  {
    id: 'write-tense-consistency',
    categoryId: 'writing',
    title: 'Zaman Tutarlılığı',
    description:
      'Akademik konvansiyona uygun zaman kullanılmış (Yöntem: geçmiş, Bulgular: geçmiş, Tartışma: şimdiki/genel) ve karışıklık yok.',
    evidenceType: 'objective',
    weight: 3,
  },
  {
    id: 'write-academic-tone',
    categoryId: 'writing',
    title: 'Akademik Üslup',
    description:
      'Birinci tekil ("ben yaptım") yerine bilimsel pasif/üçüncü tekil; gündelik dil değil; nesnel ton.',
    evidenceType: 'subjective',
    weight: 3,
  },
];

// ----------------------------------------------------------------------------
// Yardımcı erişimler
// ----------------------------------------------------------------------------

export function getRubricCategory(id: RubricCategoryId): RubricCategory {
  const cat = RUBRIC_CATEGORIES.find((c) => c.id === id);
  if (!cat) throw new Error(`Unknown rubric category: ${id}`);
  return cat;
}

export function getRubricItemsByCategory(id: RubricCategoryId): RubricItem[] {
  return RUBRIC_ITEMS.filter((it) => it.categoryId === id);
}

export function getRubricItemById(id: string): RubricItem | undefined {
  return RUBRIC_ITEMS.find((it) => it.id === id);
}

// Sanity check (dev-time): ID'ler unique, kategori ID'leri tutarlı.
// İlk import'ta bir kez çalışır; failure crash → konfig hatası anında görünür.
(function validateRubric() {
  const ids = new Set<string>();
  for (const item of RUBRIC_ITEMS) {
    if (ids.has(item.id)) {
      throw new Error(`[rubric] Duplicate item id: ${item.id}`);
    }
    ids.add(item.id);
    if (!RUBRIC_CATEGORIES.find((c) => c.id === item.categoryId)) {
      throw new Error(`[rubric] Item ${item.id} has unknown categoryId: ${item.categoryId}`);
    }
  }
  // Total weight per category (kategori içi normalize için)
  for (const cat of RUBRIC_CATEGORIES) {
    const items = getRubricItemsByCategory(cat.id);
    if (items.length === 0) {
      throw new Error(`[rubric] Category ${cat.id} has no items`);
    }
  }
})();
