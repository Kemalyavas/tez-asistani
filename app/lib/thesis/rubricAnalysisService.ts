// app/lib/thesis/rubricAnalysisService.ts
// ============================================================================
// TezAI Rubric-Based Analysis Service v1.0
// ============================================================================
//
// İki katmanlı pipeline (AutoSCORE 2025 + Rulers 2026 + LLM-RUBRIC 2024):
//
//   Pass 1 — EXTRACT (Gemini, multimodal PDF):
//     Locked rubric'in 50 item'ını Gemini'ye sorulan kriter olarak gönderir.
//     Her item için: status (found/partial/not_found/not_applicable),
//     evidence (orijinal metin alıntısı), pageNumber, kısa comment.
//     Gemini structured output (responseSchema) ile JSON garanti uyar.
//
//   Pass 2 — SCORE (deterministic, AI yok):
//     Extract çıktısı üzerinden mekanik formülle:
//       - Item score'ları (found=1.0, partial=0.5, not_found=0.0, n/a=skip)
//       - Kategori puanı = weighted avg of items, kategori weight'e göre
//       - Kategori seviyesi: 5 kademe (Yetersiz → Çok İyi)
//       - Genel grade: A / B+ / B / C+ / C / F (kategori weighted avg)
//     Aynı extract = aynı skor. Tutarlılık matematiksel garanti.
//
// Determinism stack:
//   - temperature: 0, topP: 1, topK: 1
//   - responseSchema (Gemini SDK structured output)
//   - Schema validation + retry up to 3x
//
// Geriye uyumluluk:
//   toLegacyShape() yeni RubricAnalysisResult'ı eski PremiumAnalysisResult'a
//   çevirir; frontend değişikliği gerekmez.
// ============================================================================

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import {
  RUBRIC_CATEGORIES,
  RUBRIC_ITEMS,
  RUBRIC_VERSION,
  EMPIRICAL_ONLY_ITEM_IDS,
  FOUNDATIONAL_ITEM_IDS,
  classifyThesisLevel,
  getCategoryWeight,
  type ThesisLevel,
  type ItemStatus,
  type RubricCategoryId,
  type RubricItem,
  getRubricCategory,
  getRubricItemById,
} from './rubric';
import type { PremiumAnalysisResult } from './premiumAnalysisService';

// ----------------------------------------------------------------------------
// Tipler — yeni rubric tabanlı çıktı
// ----------------------------------------------------------------------------

export interface ExtractedItem {
  id: string;
  status: ItemStatus;
  evidence: string;
  pageNumber: number | null;
  comment: string;
  // Teze ÖZEL, somut, tek cümlelik düzeltme talimatı. Yalnızca partial/not_found
  // için doludur (found/not_applicable'da boş). UI'da yeşil "Ne yapmalısın" kutusu.
  actionHint: string;
}

// Tez genelinde Gemini'nin saydığı nicel değerler. Multimodal okuduğu için
// (tabloları/şekilleri görür) regex tabanlı text sayımından daha güvenilir.
export interface ExtractStatistics {
  referenceCount: number;
  figureCount: number;
  tableCount: number;
}

// Tezin yöntemsel türü — empirik-only kriterlerin uygulanabilirliğini belirler.
//   - 'empirical':   birincil veri toplayan nicel/nitel/karma çalışma.
//   - 'theoretical': teorik/kavramsal/derleme/hukuki — birincil veri yok.
//   - 'mixed':       hem teorik hem empirik bileşen içerir.
// Tespit edilemezse güvenli varsayılan 'empirical' (kriterlere bedava geçiş yok).
export type StudyType = 'empirical' | 'theoretical' | 'mixed';

export interface ExtractResult {
  detectedLanguage: 'tr' | 'en';
  thesisType: string;
  studyType: StudyType;
  items: ExtractedItem[];
  statistics: ExtractStatistics;
  rawProcessingMs: number;
}

export type CategoryLevel =
  | 'cok_iyi'
  | 'iyi'
  | 'yeterli'
  | 'gelistirilebilir'
  | 'yetersiz';

export interface CategoryResult {
  id: RubricCategoryId;
  title: string;
  level: CategoryLevel;
  levelLabel: string;
  scoreNumeric: number;
  weightedRatio: number;
  // false = kategorinin TÜM kriterleri not_applicable (örn. teorik tezde tamamen
  // empirik bir kategori). Bu durumda kategori genel nottan DIŞLANIR ve UI'da
  // "Uygulanamaz" gösterilir — 0 puanla genel notu yanlışlıkla aşağı çekmez.
  applicable: boolean;
  itemsTotal: number;
  itemsFound: number;
  itemsPartial: number;
  itemsNotFound: number;
  itemsNotApplicable: number;
  strengths: ExtractedItem[];
  improvements: ExtractedItem[];
}

export type OverallGrade = 'A' | 'B+' | 'B' | 'C+' | 'C' | 'F';

export interface RubricAnalysisResult {
  rubricVersion: string;
  detectedLanguage: 'tr' | 'en';
  thesisType: string;
  studyType: StudyType;
  // Genel skor ağırlıklandırmasında kullanılan seviye (master/doctoral).
  thesisLevel: ThesisLevel;
  // Yüklenen dosya muhtemelen tam bir tez değil (temel bölümlerin çoğu eksik).
  // UI'da "kısmi yükleme" uyarısı gösterilir; puanı DEĞİŞTİRMEZ, sadece bağlam verir.
  likelyPartialUpload: boolean;
  overallGrade: OverallGrade;
  gradeLabel: string;
  overallScoreNumeric: number;
  // KAPI kuralında kullanılan kritik (not_found, ağırlık≥5) kriter sayısı.
  criticalCount: number;
  categories: CategoryResult[];
  criticalFindings: ExtractedItem[];
  partialFindings: ExtractedItem[];
  topStrengths: ExtractedItem[];
  executiveSummary: string;
  metadata: {
    modelUsed: string;
    extractMs: number;
    scoreMs: number;
    totalMs: number;
  };
}

// ----------------------------------------------------------------------------
// Gemini setup
// ----------------------------------------------------------------------------

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ----------------------------------------------------------------------------
// Pass 1 — EXTRACT
// ----------------------------------------------------------------------------

const RUBRIC_ITEM_IDS = RUBRIC_ITEMS.map((it) => it.id);

/**
 * Gemini structured output schema. responseMimeType='application/json' ile
 * birlikte verildiğinde model çıktısının bu şemaya uyması garanti olur
 * (https://ai.google.dev/gemini-api/docs/structured-output).
 */
function buildExtractSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      detectedLanguage: {
        type: SchemaType.STRING,
        enum: ['tr', 'en'],
        description: 'Tezin yazıldığı dil',
      },
      thesisType: {
        type: SchemaType.STRING,
        description: "Tez türü, örn. 'Yüksek Lisans Tezi', 'Doktora Tezi'",
      },
      studyType: {
        type: SchemaType.STRING,
        enum: ['empirical', 'theoretical', 'mixed'],
        description:
          "Tezin yöntemsel türü. 'empirical' = birincil veri toplayan nicel/nitel/karma çalışma (anket, deney, ölçek, görüşme, gözlem). 'theoretical' = teorik/kavramsal/derleme/hukuki/doktrinal analiz; birincil veri toplamaz. 'mixed' = hem teorik hem empirik bileşen. Emin değilsen 'empirical' seç.",
      },
      items: {
        type: SchemaType.ARRAY,
        description: 'Her rubric item için bir değerlendirme objesi',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.STRING,
              enum: RUBRIC_ITEM_IDS,
              description: 'Rubric item id (kebab-case)',
            },
            status: {
              type: SchemaType.STRING,
              enum: ['found', 'partial', 'not_found', 'not_applicable'],
              description:
                'found = kriter tam karşılanmış; partial = kısmen; not_found = karşılanmamış; not_applicable = bu tez için geçerli değil',
            },
            evidence: {
              type: SchemaType.STRING,
              description:
                'Tezden orijinal metin alıntısı (en fazla 200 karakter). Alıntı yoksa boş string.',
            },
            pageNumber: {
              type: SchemaType.INTEGER,
              description: 'Evidence bulunan sayfa numarası. Bilinmiyorsa 0.',
            },
            comment: {
              type: SchemaType.STRING,
              description:
                'Kısa açıklama (1-2 cümle). TEZİN DİLİNDE yaz — Türkçe tez için Türkçe, İngilizce tez için İngilizce. Status not_found ise eksiği, partial ise eksik kısmı, found ise neyi sağladığını söyle.',
            },
            actionHint: {
              type: SchemaType.STRING,
              description:
                'SADECE status "partial" veya "not_found" ise doldur: BU TEZE özel, somut, tek cümlelik, uygulanabilir düzeltme talimatı (tezin dilinde). Örn. "Giriş bölümünün sonuna araştırma sorusunu tek cümlede açıkça yazın." Genel klişe DEĞİL, bu tezin durumuna özgü ol. status "found" veya "not_applicable" ise boş string ("").',
            },
          },
          required: ['id', 'status', 'evidence', 'pageNumber', 'comment', 'actionHint'],
        },
      },
      statistics: {
        type: SchemaType.OBJECT,
        description:
          'Tez genelinde nicel sayımlar. TAHMİN ETME — kaynakçayı, şekilleri ve tabloları gerçekten tarayıp say.',
        properties: {
          referenceCount: {
            type: SchemaType.INTEGER,
            description: 'Kaynakça/References bölümündeki kaynak girdilerinin sayısı (her girdiyi tek tek say). Bölüm yoksa 0.',
          },
          figureCount: {
            type: SchemaType.INTEGER,
            description: 'Tezdeki toplam şekil/grafik sayısı (Şekil 1, Figure 1, Grafik 1...). Yoksa 0.',
          },
          tableCount: {
            type: SchemaType.INTEGER,
            description: 'Tezdeki toplam tablo sayısı (Tablo 1, Table 1, Çizelge 1...). Yoksa 0.',
          },
        },
        required: ['referenceCount', 'figureCount', 'tableCount'],
      },
    },
    required: ['detectedLanguage', 'thesisType', 'studyType', 'items', 'statistics'],
  };
}

function buildExtractPrompt(): string {
  // Locked rubric'i prompt içine inline et — model her seferinde aynı 50 item'ı görür.
  const itemsBlock = RUBRIC_ITEMS.map((it, i) => {
    const cat = getRubricCategory(it.categoryId);
    return `${i + 1}. [${it.id}] (${cat.title}) ${it.title}\n   Kriter: ${it.description}`;
  }).join('\n\n');

  // Teorik/derleme tezlerde not_applicable işaretlenecek empirik kriterler.
  const empiricalOnlyBlock = EMPIRICAL_ONLY_ITEM_IDS.map((id) => {
    const it = getRubricItemById(id);
    return it ? `   - [${it.id}] ${it.title}` : '';
  })
    .filter(Boolean)
    .join('\n');

  return `Sen YÖK standartlarına ve uluslararası akademik kriterlere hakim, deneyimli bir tez jürisisin. (You are an experienced thesis evaluator familiar with both Turkish YÖK standards and international academic criteria.)

Sana ekli olarak bir Türkçe veya İngilizce yüksek lisans / doktora tezi PDF'i sunuluyor. Görevin: aşağıdaki 50 kriterin her biri için tezi kontrol et ve sonucu yapılandırılmış JSON olarak döndür.

(A Turkish or English master's / PhD thesis is attached. Your task: check the thesis against each of the 50 criteria below and return the result as structured JSON.)

ÇOK ÖNEMLİ KURALLAR / IMPORTANT RULES:
1. Her kriter için MUTLAKA bir değerlendirme döndür — eksik bırakma. (Always return an evaluation for every criterion.)
2. status değerleri:
   - "found": Kriter tezde net olarak karşılanmış. / Criterion clearly met.
   - "partial": Kısmen karşılanmış. / Partially met.
   - "not_found": Karşılanmamış / bulunamadı. / Not met / not present.
   - "not_applicable": Bu tez tipi için geçerli değil (ör. teorik tezde etik kurul onayı). / Not applicable for this thesis type.
3. evidence alanına tezdeki ORİJİNAL metni alıntıla (en fazla 200 karakter). / Quote the original text from the thesis (max 200 chars).
4. pageNumber: alıntının bulunduğu sayfa numarası, bilinmiyorsa 0. / Page where the evidence appears, 0 if unknown.
5. **comment: TEZİN DİLİNDE 1-2 cümle yaz.** Türkçe tez → Türkçe comment; İngilizce tez → English comment. NEYI yaptığını/yapmadığını net söyle. (Write the comment IN THE LANGUAGE OF THE THESIS. State concretely what is done or missing — no vague praise.)
6. Tarafsız ol. "Bu çok güzel" / "Excellent" gibi övgü ya da abartı kullanma. (Stay neutral; no flattery.)
7. detectedLanguage: tezin dilini "tr" veya "en" olarak belirt. thesisType: "Yüksek Lisans Tezi" / "Doktora Tezi" / "Master's Thesis" / "PhD Thesis" — tezin diline uygun olanı seç.
8. **actionHint — SADECE status "partial" veya "not_found" olan kriterler için**: BU TEZE özel, somut, tek cümlelik, uygulanabilir bir düzeltme talimatı yaz (tezin dilinde). "Şu bölüme şunu ekleyin", "Şu sayfadaki tabloya kaynak belirtin" gibi. Genel klişe verme; tezin gerçek durumuna göre yaz. status "found" / "not_applicable" ise actionHint = "" (boş). (Write a thesis-specific one-sentence fix only for partial/not_found; empty for found/not_applicable.)
9. **statistics — gerçekten say, tahmin etme**: referenceCount (kaynakça girdi sayısı), figureCount (şekil/grafik sayısı), tableCount (tablo/çizelge sayısı). PDF ekliyse görselleri ve kaynakça listesini doğrudan tarayarak say. İlgili bölüm yoksa 0. (Actually count; do not estimate.)

**TEZ TÜRÜ VE UYGULANABİLİRLİK — ÇOK ÖNEMLİ (adil değerlendirme):**
Önce tezin yöntem türünü (studyType) belirle:
- "empirical": anket/deney/ölçek/görüşme/gözlem ile BİRİNCİL VERİ toplayan nicel/nitel/karma çalışma.
- "theoretical": teorik/kavramsal/derleme/hukuki/doktrinal analiz; birincil veri TOPLAMAZ.
- "mixed": hem teorik hem empirik bileşen içerir.

Eğer tez "theoretical" ise, aşağıdaki EMPİRİK kriterler bu tez türünde UYGULANAMAZ. Bunları "not_applicable" işaretle — ASLA "not_found" değil. (Bu bir eksiklik DEĞİL; o tür için anlamsızdır. Teorik bir hukuk/derleme tezinden örneklem veya istatistik testi beklenmez.)
${empiricalOnlyBlock}

DİKKAT: Bu muafiyet SADECE gerçekten teorik/derleme tezler içindir. Eğer tez EMPİRİK (veri topluyor) ama bu kriterleri yerine getirmemişse, "not_found" işaretle (bu gerçek bir eksikliktir). Empirik bir teze bedava geçiş VERME. "mixed" tezlerde kriter ilgili bileşende varsa değerlendir, yoksa not_applicable.

Değerlendirilecek 50 kriter:

${itemsBlock}

Şimdi tezi oku ve her kriter için JSON çıktısını üret. responseSchema'ya bire bir uy.`;
}

/**
 * Extract pass'in girdi tipi:
 *   - 'pdf':  Gemini'ye PDF buffer multimodal gönderilir (görseller, tablolar
 *              dahil tam analiz). 50MB altı PDF'ler için tercih edilen yol.
 *   - 'text': DOCX gibi multimodal desteklenmeyen formatlar veya çok büyük
 *              PDF'ler için. Mammoth/pdf-parse ile çıkarılan düz metin
 *              prompt'a inline edilir; Gemini görselleri görmez ama metinden
 *              50 kriteri yine değerlendirir.
 */
export type ExtractInput =
  | { mode: 'pdf'; buffer: Buffer }
  | { mode: 'text'; text: string };

// Çok büyük dökümanlarda Gemini'nin context'ini boşa harcamamak için cap.
// 1M token ≈ 750K kelime ≈ ~4M karakter; 500K char güvenli + zengin.
const TEXT_MODE_MAX_CHARS = 500_000;

export async function extractRubricItems(
  input: ExtractInput,
  options: { fileName: string; signal?: AbortSignal }
): Promise<ExtractResult> {
  const startMs = Date.now();
  const modelName = process.env.GEMINI_PRO_MODEL || 'gemini-3.1-pro-preview';

  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: {
      temperature: 0,
      topP: 1,
      topK: 1,
      maxOutputTokens: 32768,
      responseMimeType: 'application/json',
      responseSchema: buildExtractSchema() as any,
    },
  });

  const basePrompt = buildExtractPrompt();

  // Mod-bazlı içerik hazırlığı
  let contentParts: any[];
  let modeInfo: string;

  if (input.mode === 'pdf') {
    const pdfBase64 = input.buffer.toString('base64');
    contentParts = [
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      { text: basePrompt },
    ];
    modeInfo = `mode=pdf, fileSize=${(input.buffer.length / 1024 / 1024).toFixed(2)}MB`;
  } else {
    // Text mode — PDF eki yok; metin prompt'un içine inline edilir.
    // Çok büyük metinleri kes (rubric prompt + 500K text = ~510K, 1M ctx'e sığar).
    const truncated =
      input.text.length > TEXT_MODE_MAX_CHARS
        ? input.text.substring(0, TEXT_MODE_MAX_CHARS) +
          '\n\n[...Dökümanın geri kalanı boyut sınırı nedeniyle kesildi...]'
        : input.text;
    const textBlock = `\n\nTEZ METNİ (PDF eki yok, düz metin):\n===\n${truncated}\n===`;
    contentParts = [{ text: basePrompt + textBlock }];
    modeInfo = `mode=text, textLen=${input.text.length}${
      input.text.length > TEXT_MODE_MAX_CHARS ? ' (truncated)' : ''
    }`;
  }

  // Schema validation + retry on malformed output
  const MAX_ATTEMPTS = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[RUBRIC EXTRACT] Attempt ${attempt}/${MAX_ATTEMPTS} — model=${modelName}, ${modeInfo}`
      );

      const result = await model.generateContent(
        contentParts,
        options.signal ? { signal: options.signal } : undefined
      );

      const text = result.response.text();
      const parsed = JSON.parse(text);

      // Sanity check: items array var mı, ID'ler tanıdık mı
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error('Extract response missing items array');
      }

      // Bilinmeyen item id'leri filtrele (model rubric dışında bir şey üretirse)
      // + alanları defansif normalize et (actionHint/comment/evidence her zaman string).
      const validIds = new Set(RUBRIC_ITEM_IDS);
      const validItems = (parsed.items as ExtractedItem[])
        .filter((it) => validIds.has(it.id))
        .map((it) => ({
          ...it,
          comment: typeof it.comment === 'string' ? it.comment : '',
          evidence: typeof it.evidence === 'string' ? it.evidence : '',
          actionHint: typeof it.actionHint === 'string' ? it.actionHint : '',
        }));

      if (validItems.length < RUBRIC_ITEMS.length * 0.6) {
        // Model rubric'in %60'ını bile karşılayamadıysa retry yap
        throw new Error(
          `Extract returned only ${validItems.length}/${RUBRIC_ITEMS.length} valid items (below 60% threshold)`
        );
      }

      // İstatistikleri normalize et (negatif/NaN/eksik → 0).
      const rawStats = (parsed.statistics ?? {}) as Partial<ExtractStatistics>;
      const toCount = (v: unknown): number =>
        typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0;
      const statistics: ExtractStatistics = {
        referenceCount: toCount(rawStats.referenceCount),
        figureCount: toCount(rawStats.figureCount),
        tableCount: toCount(rawStats.tableCount),
      };

      // studyType — geçersiz/eksikse güvenli varsayılan 'empirical' (bedava geçiş yok).
      const studyType: StudyType =
        parsed.studyType === 'theoretical' || parsed.studyType === 'mixed'
          ? parsed.studyType
          : 'empirical';

      const elapsed = Date.now() - startMs;
      console.log(
        `[RUBRIC EXTRACT] OK in ${elapsed}ms — ${validItems.length}/${RUBRIC_ITEMS.length} items, lang=${parsed.detectedLanguage}, studyType=${studyType}, refs=${statistics.referenceCount} fig=${statistics.figureCount} tbl=${statistics.tableCount}`
      );

      return {
        detectedLanguage: parsed.detectedLanguage === 'en' ? 'en' : 'tr',
        thesisType: parsed.thesisType || 'Yüksek Lisans Tezi',
        studyType,
        items: validItems,
        statistics,
        rawProcessingMs: elapsed,
      };
    } catch (err) {
      lastError = err;
      // Zaman aşımı/abort → tekrar DENEME, hemen yukarı fırlat. (process route
      // 280s'de abortController.abort() çağırır; retry yapmak boşa zaman harcar
      // ve zaten iptal edilmiş signal'le anında tekrar reddedilir.) Üstteki
      // timeout guard krediyi iade edip dokümanı failed yapar.
      if (options.signal?.aborted || (err as Error)?.name === 'AbortError') {
        throw err;
      }
      console.warn(
        `[RUBRIC EXTRACT] Attempt ${attempt} failed:`,
        (err as Error).message
      );
      if (attempt < MAX_ATTEMPTS) {
        // Kısa bekleme (jitter), API rate limit'e merhamet
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw new Error(
    `Rubric extract failed after ${MAX_ATTEMPTS} attempts: ${(lastError as Error)?.message}`
  );
}

// ----------------------------------------------------------------------------
// Pass 2 — SCORE (deterministic, no AI)
// ----------------------------------------------------------------------------

function statusToScore(status: ItemStatus): number {
  switch (status) {
    case 'found':
      return 1.0;
    case 'partial':
      return 0.5;
    case 'not_found':
      return 0.0;
    case 'not_applicable':
      return -1; // sentinel: skip
  }
}

function ratioToLevel(ratio: number): CategoryLevel {
  if (ratio >= 0.9) return 'cok_iyi';
  if (ratio >= 0.75) return 'iyi';
  if (ratio >= 0.6) return 'yeterli';
  if (ratio >= 0.4) return 'gelistirilebilir';
  return 'yetersiz';
}

function levelLabel(level: CategoryLevel): string {
  switch (level) {
    case 'cok_iyi':
      return 'Çok İyi';
    case 'iyi':
      return 'İyi';
    case 'yeterli':
      return 'Yeterli';
    case 'gelistirilebilir':
      return 'Geliştirilebilir';
    case 'yetersiz':
      return 'Yetersiz';
  }
}

function ratioToOverallGrade(ratio: number): { grade: OverallGrade; label: string } {
  if (ratio >= 0.9) return { grade: 'A', label: 'Mükemmel' };
  if (ratio >= 0.8) return { grade: 'B+', label: 'Çok İyi' };
  if (ratio >= 0.7) return { grade: 'B', label: 'İyi' };
  if (ratio >= 0.6) return { grade: 'C+', label: 'Yeterli' };
  if (ratio >= 0.5) return { grade: 'C', label: 'Geliştirilebilir' };
  return { grade: 'F', label: 'Önemli Revizyon Gerek' };
}

function scoreCategory(catId: RubricCategoryId, items: ExtractedItem[]): CategoryResult {
  const cat = getRubricCategory(catId);
  const catItemDefs = RUBRIC_ITEMS.filter((r) => r.categoryId === catId);
  // Item id → extracted'taki kayıt
  const extractedById = new Map(items.map((i) => [i.id, i]));

  let totalWeight = 0;
  let weightedScore = 0;
  let found = 0;
  let partial = 0;
  let notFound = 0;
  let notApplicable = 0;

  const strengths: ExtractedItem[] = [];
  const improvements: ExtractedItem[] = [];

  for (const def of catItemDefs) {
    const ext = extractedById.get(def.id);
    if (!ext) {
      // Model bu item'ı atladıysa not_found say (en kötümser, defansif)
      notFound++;
      totalWeight += def.weight;
      // weightedScore += 0 — implicit
      continue;
    }

    const score = statusToScore(ext.status);

    if (score === -1) {
      // not_applicable: weight'i toplamı dışında bırak (kategoriyi distort etmez)
      notApplicable++;
      continue;
    }

    totalWeight += def.weight;
    weightedScore += score * def.weight;

    if (ext.status === 'found') {
      found++;
      // Yüksek-weight + found → güçlü yön kandidatı
      if (def.weight >= 4) strengths.push(ext);
    } else if (ext.status === 'partial') {
      partial++;
      improvements.push(ext);
    } else if (ext.status === 'not_found') {
      notFound++;
      improvements.push(ext);
    }
  }

  const ratio = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const level = ratioToLevel(ratio);

  return {
    id: catId,
    title: cat.title,
    level,
    levelLabel: levelLabel(level),
    scoreNumeric: Math.round(ratio * 100),
    weightedRatio: ratio,
    // totalWeight 0 ise kategorinin tüm kriterleri not_applicable → uygulanamaz.
    applicable: totalWeight > 0,
    itemsTotal: catItemDefs.length,
    itemsFound: found,
    itemsPartial: partial,
    itemsNotFound: notFound,
    itemsNotApplicable: notApplicable,
    // Top 2 strength + top 3 improvement göster (UI ekonomik kalsın)
    strengths: strengths.slice(0, 2),
    improvements: improvements.slice(0, 3),
  };
}

function buildExecutiveSummary(
  categories: CategoryResult[],
  grade: OverallGrade,
  detectedLanguage: 'tr' | 'en'
): string {
  // Deterministic özet — AI üretmiyor, mekanik şablon. Tutarlılık için.
  const strongCats = categories.filter((c) => c.weightedRatio >= 0.75).map((c) => c.title);
  const weakCats = categories.filter((c) => c.weightedRatio < 0.6).map((c) => c.title);

  if (detectedLanguage === 'en') {
    const parts: string[] = [];
    parts.push(`Overall grade: ${grade}.`);
    if (strongCats.length) parts.push(`Strong areas: ${strongCats.join(', ')}.`);
    if (weakCats.length) parts.push(`Areas needing improvement: ${weakCats.join(', ')}.`);
    if (!strongCats.length && !weakCats.length) {
      parts.push('The thesis shows balanced performance across all categories.');
    }
    return parts.join(' ');
  }

  const parts: string[] = [];
  parts.push(`Genel değerlendirme: ${grade}.`);
  if (strongCats.length) parts.push(`Güçlü alanlar: ${strongCats.join(', ')}.`);
  if (weakCats.length) parts.push(`Geliştirme bekleyen alanlar: ${weakCats.join(', ')}.`);
  if (!strongCats.length && !weakCats.length) {
    parts.push('Tez tüm kategorilerde dengeli bir performans gösteriyor.');
  }
  return parts.join(' ');
}

export function scoreRubric(extract: ExtractResult): RubricAnalysisResult {
  const startMs = Date.now();

  // Her kategori için ayrı puan hesapla
  const categories: CategoryResult[] = RUBRIC_CATEGORIES.map((cat) =>
    scoreCategory(cat.id, extract.items)
  );

  // Genel puan: kategori puanları SEVİYEYE GÖRE kategori ağırlığıyla weighted.
  // (Doktora özgünlük-ağırlıklı, yüksek lisans yetkinlik-ağırlıklı — kanıt: rubric.ts)
  // Tamamen not_applicable kategoriler (applicable=false) genel nota KATILMAZ —
  // aksi halde 0 puanla genel notu haksızca aşağı çekerlerdi (teorik tez bugu).
  const thesisLevel: ThesisLevel = classifyThesisLevel(extract.thesisType);
  let totalCatWeight = 0;
  let weightedCatScore = 0;
  for (const c of categories) {
    if (!c.applicable) continue;
    const w = getCategoryWeight(c.id, thesisLevel);
    totalCatWeight += w;
    weightedCatScore += c.weightedRatio * w;
  }
  const overallRatio = totalCatWeight > 0 ? weightedCatScore / totalCatWeight : 0;

  // Critical / partial / strength findings + KAPI kuralı için kritik sayımı.
  const allCriticals: ExtractedItem[] = [];
  const allPartials: ExtractedItem[] = [];
  const allStrengths: ExtractedItem[] = [];
  // Gerçek kritik = bir core kriter TAMAMEN karşılanmamış (UI'daki "KRİTİK"
  // rozetiyle aynı): not_found + ağırlık≥5 + format-binary değil.
  let criticalCount = 0;

  for (const ext of extract.items) {
    const def = getRubricItemById(ext.id);
    if (!def) continue;
    if (ext.status === 'not_found' && def.weight >= 4) allCriticals.push(ext);
    else if (ext.status === 'partial') allPartials.push(ext);
    else if (ext.status === 'found' && def.weight >= 4) allStrengths.push(ext);

    if (
      ext.status === 'not_found' &&
      def.weight >= 5 &&
      !(def.categoryId === 'format' && def.evidenceType === 'binary')
    ) {
      criticalCount++;
    }
  }

  // "KAPI" KURALI (Principle A — Mullins & Kiley 2002, Lovitts/Wageningen):
  // Saf toplama ortalaması, güçlü kategorilerin tek bir KRİTİK eksiği maskelemesine
  // izin vermemeli ("tek 'kabul edilemez' kriter üst notları engeller"). Bir core
  // kriter tamamen karşılanmamışsa GENEL NOT bir tavan görür:
  //   1 kritik → max B (İyi, ≤79); 2 → max C+ (Yeterli, ≤69); 3+ → max C (≤59).
  // Kategori puanları DEĞİŞMEZ; yalnızca genel not sınırlanır.
  let cappedRatio = overallRatio;
  if (criticalCount >= 3) cappedRatio = Math.min(cappedRatio, 0.59);
  else if (criticalCount === 2) cappedRatio = Math.min(cappedRatio, 0.69);
  else if (criticalCount === 1) cappedRatio = Math.min(cappedRatio, 0.79);
  const { grade, label } = ratioToOverallGrade(cappedRatio);

  // Önceliklendirme: weight'e göre azalan sırada
  const byWeightDesc = (a: ExtractedItem, b: ExtractedItem) =>
    (getRubricItemById(b.id)?.weight ?? 0) - (getRubricItemById(a.id)?.weight ?? 0);

  allCriticals.sort(byWeightDesc);
  allPartials.sort(byWeightDesc);
  allStrengths.sort(byWeightDesc);

  const summary = buildExecutiveSummary(categories, grade, extract.detectedLanguage);

  // Kısmi yükleme tespiti: temel/yapısal kriterlerin (kapak, özet, içindekiler,
  // kaynakça, bölüm yapısı, problem tanımı, sonuç) çoğu not_found ise yüklenen
  // dosya muhtemelen tam bir tez değil (tek bölüm/taslak). Puanı değiştirmez.
  const extractedById = new Map(extract.items.map((i) => [i.id, i]));
  const foundationalMissing = FOUNDATIONAL_ITEM_IDS.filter((id) => {
    const it = extractedById.get(id);
    return !it || it.status === 'not_found';
  }).length;
  const likelyPartialUpload = foundationalMissing >= 4;

  const elapsed = Date.now() - startMs;

  return {
    rubricVersion: RUBRIC_VERSION,
    detectedLanguage: extract.detectedLanguage,
    thesisType: extract.thesisType,
    studyType: extract.studyType,
    thesisLevel,
    likelyPartialUpload,
    overallGrade: grade,
    gradeLabel: label,
    overallScoreNumeric: Math.round(cappedRatio * 100),
    criticalCount,
    categories,
    criticalFindings: allCriticals.slice(0, 5),
    partialFindings: allPartials.slice(0, 5),
    topStrengths: allStrengths.slice(0, 5),
    executiveSummary: summary,
    metadata: {
      modelUsed: process.env.GEMINI_PRO_MODEL || 'gemini-3.1-pro-preview',
      extractMs: extract.rawProcessingMs,
      scoreMs: elapsed,
      totalMs: extract.rawProcessingMs + elapsed,
    },
  };
}

// ----------------------------------------------------------------------------
// Orchestrator
// ----------------------------------------------------------------------------

export async function analyzeWithRubric(
  input: ExtractInput,
  options: { fileName: string }
): Promise<RubricAnalysisResult> {
  const extract = await extractRubricItems(input, options);
  const result = scoreRubric(extract);
  return result;
}

// ----------------------------------------------------------------------------
// Geriye uyumluluk: legacy PremiumAnalysisResult shape'ine map'le
// ----------------------------------------------------------------------------
//
// Eski UI 6 section bekliyor: structure, methodology, writingQuality,
// references, literature, formatting. Yeni rubric'in 10 kategorisinden:
//   - structure   → 'structure'
//   - methodology → 'methodology'
//   - writingQuality → 'writing'
//   - references  → 'format' altındaki references-style item (ya da 'format'tan)
//   - literature  → 'literature'
//   - formatting  → 'format'
// Yeni 4 kategori (introduction, findings, discussion, conclusion, originality)
// şu an UI'da görünmüyor; sonradan eklenecek.

const GRADE_COLORS: Record<OverallGrade, string> = {
  A: '#10B981',
  'B+': '#34D399',
  B: '#6EE7B7',
  'C+': '#FCD34D',
  C: '#F59E0B',
  F: '#EF4444',
};

function severityFromExt(ext: ExtractedItem, def: RubricItem): 'critical' | 'major' | 'minor' | 'formatting' {
  if (def.categoryId === 'format' && def.evidenceType === 'binary') return 'formatting';
  if (ext.status === 'not_found') {
    if (def.weight >= 5) return 'critical';
    if (def.weight >= 4) return 'major';
    return 'minor';
  }
  // partial:
  if (def.weight >= 5) return 'major';
  return 'minor';
}

export function toLegacyShape(rubric: RubricAnalysisResult): PremiumAnalysisResult {
  const catMap = new Map(rubric.categories.map((c) => [c.id, c]));

  const sectionFromCat = (catId: RubricCategoryId) => {
    const c = catMap.get(catId);
    if (!c) {
      return { score: 50, maxScore: 100, percentage: 50, feedback: '', strengths: [], improvements: [], applicable: true };
    }
    // Tamamen not_applicable kategori: genel nota katılmadı, UI'da "Uygulanamaz".
    if (!c.applicable) {
      return {
        score: 0,
        maxScore: 100,
        percentage: 0,
        feedback: `${c.title}: Bu tez türünde uygulanmadı (kriterler bu çalışma için geçerli değil).`,
        strengths: [],
        improvements: [],
        applicable: false,
      };
    }
    return {
      score: c.scoreNumeric,
      maxScore: 100,
      percentage: c.scoreNumeric,
      feedback: `${c.title}: ${c.levelLabel} (${c.itemsFound}/${c.itemsTotal} kriter karşılandı).`,
      strengths: c.strengths.map((s) => s.comment),
      improvements: c.improvements.map((i) => i.comment),
      applicable: true,
    };
  };

  // Issues — rubric'ten extract et
  const issues = { critical: [] as any[], major: [] as any[], minor: [] as any[], formatting: [] as any[] };
  let issueCounter = 0;
  for (const ext of [...rubric.criticalFindings, ...rubric.partialFindings]) {
    const def = getRubricItemById(ext.id);
    if (!def) continue;
    const sev = severityFromExt(ext, def);
    const cat = getRubricCategory(def.categoryId);
    const issue = {
      id: `${sev}-${++issueCounter}`,
      // Rubric item id'sini de tut — UI feedback button'unun hangi item için
      // geri bildirim verildiğini bilmesi için. legacy issue id ('critical-1')
      // sadece UI key, semantik anlam taşımıyor.
      rubricItemId: def.id,
      title: def.title,
      severity: sev,
      category: 'general',
      location: cat.title,
      pageNumber: ext.pageNumber || 0,
      description: ext.comment,
      // Teze özel "ne yapmalısın" (yeşil kutu). Yoksa UI yeşil kutuyu gizler.
      actionHint: ext.actionHint || '',
      // "Beklenen kriter" (gri, bağlam) — rubric'in generic tanımı.
      suggestion: def.description,
      impact: '',
      originalText: ext.evidence,
    };
    issues[sev].push(issue);
  }

  // Strengths (legacy: string array)
  const strengths = rubric.topStrengths.map((s) => {
    const def = getRubricItemById(s.id);
    return def ? `${def.title}: ${s.comment}` : s.comment;
  });

  // Priority actions: top 3 critical/partial
  const priorityActions = [...rubric.criticalFindings, ...rubric.partialFindings]
    .slice(0, 3)
    .map((ext, idx) => {
      const def = getRubricItemById(ext.id);
      return {
        order: idx + 1,
        action: def ? `${def.title}: ${ext.comment}` : ext.comment,
        // Teze özel aksiyon varsa onu, yoksa generic kriter tanımını ver.
        reason: ext.actionHint || def?.description || '',
        relatedIssues: [],
        estimatedImpact: idx === 0 ? 'high' : ('medium' as 'high' | 'medium' | 'low'),
      };
    });

  // YÖK compliance — format kategorisinden türet
  const formatCat = catMap.get('format');
  const yokCompliance = {
    score: formatCat ? formatCat.scoreNumeric : 50,
    compliant: formatCat ? formatCat.strengths.map((s) => {
      const def = getRubricItemById(s.id);
      return def?.title ?? '';
    }).filter(Boolean) : [],
    nonCompliant: formatCat ? formatCat.improvements.map((i) => {
      const def = getRubricItemById(i.id);
      return def?.title ?? '';
    }).filter(Boolean) : [],
  };

  return {
    overallScore: rubric.overallScoreNumeric,
    grade: {
      letter: rubric.overallGrade,
      label: rubric.gradeLabel,
      color: GRADE_COLORS[rubric.overallGrade],
    },
    executiveSummary: rubric.executiveSummary,
    // Tez türü + kısmi yükleme bayrağı (UI banner/not için).
    studyType: rubric.studyType,
    likelyPartialUpload: rubric.likelyPartialUpload,
    // Tüm 10 rubric kategorisi sections object'inde gösterilir.
    // UI Object.entries ile dinamik render ettiği için yeni key eklemek
    // otomatik olarak yeni section bloğu üretir.
    // 'references' eski legacy duplicate'iydi (format'ın aynısı) — kaldırıldı.
    sections: {
      formatting: sectionFromCat('format'),
      structure: sectionFromCat('structure'),
      introduction: sectionFromCat('introduction'),
      literature: sectionFromCat('literature'),
      methodology: sectionFromCat('methodology'),
      findings: sectionFromCat('findings'),
      discussion: sectionFromCat('discussion'),
      conclusion: sectionFromCat('conclusion'),
      originality: sectionFromCat('originality'),
      writingQuality: sectionFromCat('writing'),
    },
    issues,
    strengths,
    priorityActions,
    yokCompliance,
    statistics: {
      pageCount: 0, // process route'tan dolduracak
      wordCount: 0,
      characterCount: 0,
      averageSentenceLength: 0,
      readabilityScore: 0,
      referenceCount: 0,
      figureCount: 0,
      tableCount: 0,
    },
    metadata: {
      modelUsed: rubric.metadata.modelUsed,
      analyzedAt: new Date().toISOString(),
      reportLanguage: rubric.detectedLanguage,
      analysisVersion: `rubric-${rubric.rubricVersion}`,
      processingTimeMs: rubric.metadata.totalMs,
    },
  };
}
