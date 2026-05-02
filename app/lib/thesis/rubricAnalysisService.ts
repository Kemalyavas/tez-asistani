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
}

export interface ExtractResult {
  detectedLanguage: 'tr' | 'en';
  thesisType: string;
  items: ExtractedItem[];
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
  overallGrade: OverallGrade;
  gradeLabel: string;
  overallScoreNumeric: number;
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
                'Kısa Türkçe açıklama (1-2 cümle). Status not_found ise eksiği, partial ise eksik kısmı, found ise neyi sağladığını söyle.',
            },
          },
          required: ['id', 'status', 'evidence', 'pageNumber', 'comment'],
        },
      },
    },
    required: ['detectedLanguage', 'thesisType', 'items'],
  };
}

function buildExtractPrompt(): string {
  // Locked rubric'i prompt içine inline et — model her seferinde aynı 50 item'ı görür.
  const itemsBlock = RUBRIC_ITEMS.map((it, i) => {
    const cat = getRubricCategory(it.categoryId);
    return `${i + 1}. [${it.id}] (${cat.title}) ${it.title}\n   Kriter: ${it.description}`;
  }).join('\n\n');

  return `Sen YÖK standartlarına ve uluslararası akademik kriterlere hakim, deneyimli bir tez jürisisin.

Sana ekli olarak bir Türkçe veya İngilizce yüksek lisans / doktora tezi PDF'i sunuluyor. Görevin: aşağıdaki 50 kriterin her biri için tezi kontrol et ve sonucu yapılandırılmış JSON olarak döndür.

ÇOK ÖNEMLİ KURALLAR:
1. Her kriter için MUTLAKA bir değerlendirme döndür — eksik bırakma.
2. status değerleri:
   - "found": Kriter tezde net olarak karşılanmış.
   - "partial": Kısmen karşılanmış (ör. var ama eksik/yetersiz).
   - "not_found": Karşılanmamış / bulunamadı.
   - "not_applicable": Bu tez tipi için geçerli değil (ör. teorik tezde "etik kurul onayı").
3. evidence alanına tezdeki ORİJİNAL metni alıntıla (en fazla 200 karakter). Alıntı yapamıyorsan boş bırak.
4. pageNumber: alıntının bulunduğu sayfa numarası (PDF metadata sayfası, bilinmiyorsa 0).
5. comment: 1-2 cümle Türkçe açıklama. NEYI yaptığını/yapmadığını net söyle, genel laf etme.
6. Tarafsız ol. "Bu çok güzel" / "Bu mükemmel" gibi övgü ya da abartı kullanma.
7. Tezin dilini detectedLanguage'da belirt; thesisType'a "Yüksek Lisans Tezi" veya "Doktora Tezi" yaz (kapaktan görüyorsun).

Değerlendirilecek 50 kriter:

${itemsBlock}

Şimdi tezi oku ve her kriter için JSON çıktısını üret. responseSchema'ya bire bir uy.`;
}

export async function extractRubricItems(
  pdfBuffer: Buffer,
  options: { fileName: string }
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

  const prompt = buildExtractPrompt();
  const pdfBase64 = pdfBuffer.toString('base64');

  // Schema validation + retry on malformed output
  const MAX_ATTEMPTS = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[RUBRIC EXTRACT] Attempt ${attempt}/${MAX_ATTEMPTS} — model=${modelName}, fileSize=${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`
      );

      const result = await model.generateContent([
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
        { text: prompt },
      ]);

      const text = result.response.text();
      const parsed = JSON.parse(text);

      // Sanity check: items array var mı, ID'ler tanıdık mı
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new Error('Extract response missing items array');
      }

      // Bilinmeyen item id'leri filtrele (model rubric dışında bir şey üretirse)
      const validIds = new Set(RUBRIC_ITEM_IDS);
      const validItems = (parsed.items as ExtractedItem[]).filter((it) =>
        validIds.has(it.id)
      );

      if (validItems.length < RUBRIC_ITEMS.length * 0.6) {
        // Model rubric'in %60'ını bile karşılayamadıysa retry yap
        throw new Error(
          `Extract returned only ${validItems.length}/${RUBRIC_ITEMS.length} valid items (below 60% threshold)`
        );
      }

      const elapsed = Date.now() - startMs;
      console.log(
        `[RUBRIC EXTRACT] OK in ${elapsed}ms — ${validItems.length}/${RUBRIC_ITEMS.length} items, lang=${parsed.detectedLanguage}`
      );

      return {
        detectedLanguage: parsed.detectedLanguage === 'en' ? 'en' : 'tr',
        thesisType: parsed.thesisType || 'Yüksek Lisans Tezi',
        items: validItems,
        rawProcessingMs: elapsed,
      };
    } catch (err) {
      lastError = err;
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

  // Genel puan: kategori puanları weighted by category weight
  let totalCatWeight = 0;
  let weightedCatScore = 0;
  for (const c of categories) {
    const catDef = getRubricCategory(c.id);
    totalCatWeight += catDef.weight;
    weightedCatScore += c.weightedRatio * catDef.weight;
  }
  const overallRatio = totalCatWeight > 0 ? weightedCatScore / totalCatWeight : 0;
  const { grade, label } = ratioToOverallGrade(overallRatio);

  // Critical / partial / strength findings — kategoriler arasında topla
  const allCriticals: ExtractedItem[] = [];
  const allPartials: ExtractedItem[] = [];
  const allStrengths: ExtractedItem[] = [];

  for (const ext of extract.items) {
    const def = getRubricItemById(ext.id);
    if (!def) continue;
    if (ext.status === 'not_found' && def.weight >= 4) allCriticals.push(ext);
    else if (ext.status === 'partial') allPartials.push(ext);
    else if (ext.status === 'found' && def.weight >= 4) allStrengths.push(ext);
  }

  // Önceliklendirme: weight'e göre azalan sırada
  const byWeightDesc = (a: ExtractedItem, b: ExtractedItem) =>
    (getRubricItemById(b.id)?.weight ?? 0) - (getRubricItemById(a.id)?.weight ?? 0);

  allCriticals.sort(byWeightDesc);
  allPartials.sort(byWeightDesc);
  allStrengths.sort(byWeightDesc);

  const summary = buildExecutiveSummary(categories, grade, extract.detectedLanguage);

  const elapsed = Date.now() - startMs;

  return {
    rubricVersion: RUBRIC_VERSION,
    detectedLanguage: extract.detectedLanguage,
    thesisType: extract.thesisType,
    overallGrade: grade,
    gradeLabel: label,
    overallScoreNumeric: Math.round(overallRatio * 100),
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
  pdfBuffer: Buffer,
  options: { fileName: string }
): Promise<RubricAnalysisResult> {
  const extract = await extractRubricItems(pdfBuffer, options);
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
      return { score: 50, maxScore: 100, percentage: 50, feedback: '', strengths: [], improvements: [] };
    }
    return {
      score: c.scoreNumeric,
      maxScore: 100,
      percentage: c.scoreNumeric,
      feedback: `${c.title}: ${c.levelLabel} (${c.itemsFound}/${c.itemsTotal} kriter karşılandı).`,
      strengths: c.strengths.map((s) => s.comment),
      improvements: c.improvements.map((i) => i.comment),
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
      title: def.title,
      severity: sev,
      category: 'general',
      location: cat.title,
      pageNumber: ext.pageNumber || 0,
      description: ext.comment,
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
        reason: def?.description || '',
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
    sections: {
      structure: sectionFromCat('structure'),
      methodology: sectionFromCat('methodology'),
      writingQuality: sectionFromCat('writing'),
      references: sectionFromCat('format'),
      literature: sectionFromCat('literature'),
      formatting: sectionFromCat('format'),
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
