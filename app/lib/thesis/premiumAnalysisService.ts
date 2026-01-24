// app/lib/thesis/premiumAnalysisService.ts
// ============================================================================
// Premium Tez Analiz Servisi
// - Gemini Pro ile tam tez analizi (500K+ karakter)
// - Sayfa bazlı spesifik öneriler
// - YÖK standartları kontrolü
// - Bölüm bazlı detaylı değerlendirme
// ============================================================================

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Güvenlik ayarları - akademik içerik için
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ============================================================================
// Types
// ============================================================================

export interface PremiumAnalysisResult {
  // Genel Değerlendirme
  overallScore: number;
  grade: {
    letter: string;
    label: string;
    color: string;
  };
  executiveSummary: string;

  // Bölüm Bazlı Skorlar
  sections: {
    structure: SectionAnalysis;
    methodology: SectionAnalysis;
    literature: SectionAnalysis;
    writingQuality: SectionAnalysis;
    references: SectionAnalysis;
    formatting: SectionAnalysis;
  };

  // Sorunlar (Sayfa numaralı)
  issues: {
    critical: PagedIssue[];
    major: PagedIssue[];
    minor: PagedIssue[];
    formatting: PagedIssue[];
  };

  // Güçlü Yönler
  strengths: string[];

  // Öncelikli Eylemler
  priorityActions: PriorityAction[];

  // YÖK Uyumluluk
  yokCompliance: {
    score: number;
    compliant: string[];
    nonCompliant: string[];
  };

  // İstatistikler
  statistics: {
    pageCount: number;
    wordCount: number;
    characterCount: number;
    referenceCount: number;
    figureCount: number;
    tableCount: number;
    averageSentenceLength: number;
    readabilityScore: number;
  };

  // Meta
  metadata: {
    analyzedAt: string;
    processingTimeMs: number;
    modelUsed: string;
    analysisVersion: string;
    reportLanguage?: 'tr' | 'en' | 'auto';
  };
}

export interface SectionAnalysis {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface PagedIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'formatting';
  category: string;
  pageNumber?: number;
  location?: string;
  originalText?: string;
  suggestion: string;
  impact: string;
}

export interface PriorityAction {
  order: number;
  action: string;
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  relatedIssues: string[];
}

// ============================================================================
// YÖK Standartları
// ============================================================================

const YOK_STANDARDS = {
  structure: [
    'Kapak sayfası (Üniversite adı, enstitü, anabilim dalı, tez başlığı, yazar adı, danışman adı, tarih)',
    'Kabul ve onay sayfası',
    'Etik beyan sayfası',
    'Özet (Türkçe, en az 150-300 kelime)',
    'Abstract (İngilizce özet)',
    'İçindekiler',
    'Tablolar listesi (varsa)',
    'Şekiller listesi (varsa)',
    'Kısaltmalar listesi (varsa)',
    'Giriş bölümü',
    'Literatür taraması / Kuramsal çerçeve',
    'Metodoloji bölümü',
    'Bulgular bölümü',
    'Tartışma ve sonuç bölümü',
    'Kaynakça',
    'Ekler (varsa)',
  ],
  formatting: [
    'A4 kağıt boyutu',
    'Sol kenar boşluğu: 4 cm (ciltleme için)',
    'Sağ kenar boşluğu: 2.5 cm',
    'Üst kenar boşluğu: 3 cm',
    'Alt kenar boşluğu: 2.5 cm',
    'Times New Roman veya benzeri serif font',
    'Ana metin: 12 punto',
    'Satır aralığı: 1.5',
    'Paragraf girinti: 1.25 cm',
    'Sayfa numaraları: Alt orta veya sağ',
    'Bölüm başlıkları tutarlı formatta',
  ],
  references: [
    'Tutarlı atıf formatı (APA 7, IEEE, vb.)',
    'Metin içi atıf ve kaynakça uyumu',
    'Kaynakların güncelliği (son 5-10 yıl ağırlıklı)',
    'Birincil kaynak kullanımı',
    'Türkçe ve yabancı kaynak dengesi',
  ],
};

// ============================================================================
// International Academic Standards (for non-Turkish theses)
// ============================================================================

const INTERNATIONAL_STANDARDS = {
  structure: [
    'Title page (University name, department, thesis title, author, advisor, date)',
    'Approval/signature page',
    'Declaration of originality',
    'Abstract (150-300 words)',
    'Table of contents',
    'List of tables (if applicable)',
    'List of figures (if applicable)',
    'List of abbreviations (if applicable)',
    'Introduction chapter',
    'Literature review / Theoretical framework',
    'Methodology chapter',
    'Results/Findings chapter',
    'Discussion and conclusion chapter',
    'References/Bibliography',
    'Appendices (if applicable)',
  ],
  formatting: [
    'A4 or Letter paper size',
    'Left margin: 1.5 inches (for binding)',
    'Right margin: 1 inch',
    'Top margin: 1 inch',
    'Bottom margin: 1 inch',
    'Times New Roman or similar serif font',
    'Body text: 12 point',
    'Line spacing: 1.5 or double',
    'Paragraph indent: 0.5 inch',
    'Page numbers: bottom center or right',
    'Consistent heading format',
  ],
  references: [
    'Consistent citation style (APA 7, MLA, Chicago, IEEE, etc.)',
    'In-text citations match reference list',
    'Recent sources (last 5-10 years preferred)',
    'Primary source usage',
    'Balance of sources',
  ],
};

// ============================================================================
// Language-specific prompt templates
// ============================================================================

const getLanguagePrompt = (lang: 'tr' | 'en', isPdf: boolean) => {
  if (lang === 'tr') {
    return {
      role: `Sen Türkiye'deki üniversitelerde 20+ yıl deneyimli bir tez danışmanısın. YÖK (Yükseköğretim Kurulu) standartlarını çok iyi biliyorsun.`,
      instruction: `Bu tezi kapsamlı şekilde analiz et ve aşağıdaki JSON formatında yanıt ver.`,
      rules: [
        'Her sorunu SAYFA NUMARASI ile belirt (örn: "Sayfa 45\'te...")',
        'Somut ve uygulanabilir öneriler ver',
        'Türkçe akademik yazım kurallarına dikkat et',
        'YÖK tez yazım kılavuzuna göre değerlendir',
        'Övgüden çok yapıcı eleştiri yap - öğrenci gelişsin',
      ],
      pdfRules: isPdf ? [
        'PDF\'teki GÖRSELLERİ, TABLOLARI ve GRAFİKLERİ de analiz et',
        'Görsel kalitesi yeterli mi?',
        'Başlık/açıklama var mı ve uygun mu?',
        'Metin ile tutarlı mı?',
        'Numaralandırma doğru mu?',
      ] : [],
      standards: YOK_STANDARDS,
      standardsLabel: 'YÖK STANDARTLARI',
      gradeLabels: {
        excellent: 'Mükemmel',
        veryGood: 'Çok İyi',
        good: 'İyi',
        aboveAverage: 'Ortanın Üstü',
        average: 'Orta',
        acceptable: 'Kabul Edilebilir',
        weak: 'Zayıf',
        insufficient: 'Yetersiz',
        fail: 'Başarısız',
      },
      statisticsNote: `ÖNEMLİ:
- referenceCount: Kaynakça/References bölümündeki TÜM kaynakları tek tek say. Her bir kaynak girişini say.
- figureCount: Tezdeki TÜM şekilleri say (Şekil 1, Figure 1, vs.)
- tableCount: Tezdeki TÜM tabloları say (Tablo 1, Table 1, vs.)
- Bu sayıları TAHMİN ETME, gerçekten say!`,
    };
  } else {
    return {
      role: `You are an experienced thesis advisor with 20+ years of experience at international universities. You are well-versed in academic standards and thesis writing guidelines.`,
      instruction: `Analyze this thesis comprehensively and respond in the following JSON format.`,
      rules: [
        'Specify each issue with PAGE NUMBER (e.g., "On page 45...")',
        'Provide concrete and actionable suggestions',
        'Pay attention to academic writing conventions',
        'Evaluate according to international thesis standards',
        'Focus on constructive criticism rather than praise - help the student improve',
      ],
      pdfRules: isPdf ? [
        'Also analyze IMAGES, TABLES, and CHARTS in the PDF',
        'Is the visual quality sufficient?',
        'Are there appropriate titles/captions?',
        'Is it consistent with the text?',
        'Is the numbering correct?',
      ] : [],
      standards: INTERNATIONAL_STANDARDS,
      standardsLabel: 'ACADEMIC STANDARDS',
      gradeLabels: {
        excellent: 'Excellent',
        veryGood: 'Very Good',
        good: 'Good',
        aboveAverage: 'Above Average',
        average: 'Average',
        acceptable: 'Acceptable',
        weak: 'Weak',
        insufficient: 'Insufficient',
        fail: 'Fail',
      },
      statisticsNote: `IMPORTANT:
- referenceCount: Count ALL references in the Bibliography/References section. Count each reference entry.
- figureCount: Count ALL figures in the thesis (Figure 1, Figure 2, etc.)
- tableCount: Count ALL tables in the thesis (Table 1, Table 2, etc.)
- Do NOT estimate these numbers, actually count them!`,
    };
  }
};

// ============================================================================
// Ana Analiz Fonksiyonu
// ============================================================================

export async function analyzePremium(
  textOrBuffer: string | Buffer,
  options: {
    fileName: string;
    isPdf?: boolean;
    includeImages?: boolean;
    preCalculatedStats?: {
      pageCount: number;
      wordCount: number;
    };
    reportLanguage?: 'tr' | 'en' | 'auto';
  }
): Promise<PremiumAnalysisResult> {
  const startTime = Date.now();

  // Gemini 3 Pro - En gelişmiş model (multimodal, PDF, görsel, dynamic thinking)
  // %50+ performans artışı, gelişmiş reasoning, 1M context
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    safetySettings,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 32768,
    },
  });

  // PDF mi yoksa metin mi?
  const isPdf = options.isPdf || (Buffer.isBuffer(textOrBuffer) && options.fileName.toLowerCase().endsWith('.pdf'));

  let text: string;
  let pdfBase64: string | null = null;

  if (isPdf && Buffer.isBuffer(textOrBuffer)) {
    // PDF'i base64'e çevir - Gemini doğrudan okuyacak
    pdfBase64 = textOrBuffer.toString('base64');
    text = ''; // Metin istatistikleri için sonra dolduracağız
    console.log(`[PREMIUM ANALYSIS] PDF mode - sending directly to Gemini (${(textOrBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    text = textOrBuffer.toString();
  }

  // Metin istatistikleri hesapla
  // PDF mode'da önceden hesaplanmış istatistikleri kullan (metin çıkarılmışsa)
  const calculatedStats = isPdf ? null : calculateStatistics(text);
  const stats = {
    pageCount: options.preCalculatedStats?.pageCount || calculatedStats?.pageCount || 0,
    wordCount: options.preCalculatedStats?.wordCount || calculatedStats?.wordCount || 0,
    characterCount: calculatedStats?.characterCount || 0,
    averageSentenceLength: calculatedStats?.averageSentenceLength || 0,
    readabilityScore: calculatedStats?.readabilityScore || 50,
    referenceCount: calculatedStats?.referenceCount || 0,
    figureCount: calculatedStats?.figureCount || 0,
    tableCount: calculatedStats?.tableCount || 0,
  };

  // Sayfa işaretleyicileri ekle (sadece metin modu için)
  const textWithPages = isPdf ? '' : addPageMarkers(text);

  // Rapor dili belirleme
  const reportLang = options.reportLanguage || 'auto';

  console.log(`[PREMIUM ANALYSIS] Starting analysis: ${isPdf ? 'PDF Direct Mode' : `${stats.pageCount} pages, ${stats.wordCount} words`}, Report language: ${reportLang}`);

  // ============================================
  // DİNAMİK ANALİZ PROMPT'U
  // ============================================

  // Dil şablonunu al (auto için önce TR kullan, Gemini tespit edecek)
  const langForPrompt = reportLang === 'auto' ? 'tr' : reportLang;
  const langPrompt = getLanguagePrompt(langForPrompt, isPdf);

  // Auto mod için ek talimat
  const autoLangInstruction = reportLang === 'auto'
    ? (langForPrompt === 'tr'
        ? '\n\nÖNEMLİ: Tezin dilini tespit et. Eğer tez İngilizce yazılmışsa, TÜM yanıtını İngilizce ver. Eğer Türkçe yazılmışsa, Türkçe yanıt ver.'
        : '\n\nIMPORTANT: Detect the thesis language. If the thesis is in Turkish, provide your ENTIRE response in Turkish. If in English, respond in English.')
    : '';

  const analysisPrompt = `${langPrompt.role}

${langPrompt.instruction}${autoLangInstruction}

${langForPrompt === 'tr' ? 'ÖNEMLİ KURALLAR' : 'IMPORTANT RULES'}:
${langPrompt.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}
${langPrompt.pdfRules.length > 0 ? `${langPrompt.rules.length + 1}. ${langPrompt.pdfRules[0]}:\n${langPrompt.pdfRules.slice(1).map(r => `   - ${r}`).join('\n')}` : ''}

${langPrompt.standardsLabel}:
${JSON.stringify(langPrompt.standards, null, 2)}

${isPdf
  ? (langForPrompt === 'tr'
      ? 'PDF DOSYASI EKLİ - Tüm sayfaları, görselleri, tabloları ve grafikleri analiz et.'
      : 'PDF FILE ATTACHED - Analyze all pages, images, tables, and charts.')
  : (langForPrompt === 'tr'
      ? `TEZ METNİ (${stats.pageCount} sayfa, ${stats.wordCount} kelime):\n===\n${textWithPages}\n===`
      : `THESIS TEXT (${stats.pageCount} pages, ${stats.wordCount} words):\n===\n${textWithPages}\n===`)}

JSON FORMAT:
{
  "overallScore": <0-100>,
  "grade": {
    "letter": "<A+/A/A-/B+/B/B-/C+/C/F>",
    "label": "<${Object.values(langPrompt.gradeLabels).join('/')}>",
    "color": "<hex color code>"
  },
  "executiveSummary": "<${langForPrompt === 'tr' ? '3-4 cümlelik genel değerlendirme' : '3-4 sentence executive summary'}>",

  "sections": {
    "structure": {
      "score": <0-100>,
      "feedback": "<${langForPrompt === 'tr' ? '2-3 cümle' : '2-3 sentences'}>",
      "strengths": ["<${langForPrompt === 'tr' ? 'güçlü yön' : 'strength'} 1>", "<${langForPrompt === 'tr' ? 'güçlü yön' : 'strength'} 2>"],
      "improvements": ["<${langForPrompt === 'tr' ? 'iyileştirme önerisi' : 'improvement suggestion'} 1>", "<${langForPrompt === 'tr' ? 'iyileştirme önerisi' : 'improvement suggestion'} 2>"]
    },
    "methodology": { "score": <0-100>, "feedback": "<...>", "strengths": [], "improvements": [] },
    "literature": { "score": <0-100>, "feedback": "<...>", "strengths": [], "improvements": [] },
    "writingQuality": { "score": <0-100>, "feedback": "<...>", "strengths": [], "improvements": [] },
    "references": { "score": <0-100>, "feedback": "<...>", "strengths": [], "improvements": [] },
    "formatting": { "score": <0-100>, "feedback": "<...>", "strengths": [], "improvements": [] }
  },

  "issues": {
    "critical": [
      {
        "title": "<${langForPrompt === 'tr' ? 'kısa başlık' : 'short title'}>",
        "description": "<${langForPrompt === 'tr' ? 'detaylı açıklama' : 'detailed description'}>",
        "pageNumber": <page number>,
        "location": "<${langForPrompt === 'tr' ? 'bölüm/paragraf' : 'section/paragraph'}>",
        "originalText": "<${langForPrompt === 'tr' ? 'sorunlu metin örneği' : 'problematic text sample'}>",
        "suggestion": "<${langForPrompt === 'tr' ? 'düzeltme önerisi' : 'correction suggestion'}>",
        "impact": "<${langForPrompt === 'tr' ? 'bu sorun neden kritik' : 'why this issue is critical'}>"
      }
    ],
    "major": [],
    "minor": [],
    "formatting": []
  },

  "strengths": ["<${langForPrompt === 'tr' ? 'tezin güçlü yönü' : 'thesis strength'} 1>", "<${langForPrompt === 'tr' ? 'tezin güçlü yönü' : 'thesis strength'} 2>"],

  "priorityActions": [
    {
      "order": 1,
      "action": "<${langForPrompt === 'tr' ? 'yapılması gereken' : 'action needed'}>",
      "reason": "<${langForPrompt === 'tr' ? 'neden önemli' : 'why important'}>",
      "estimatedImpact": "high|medium|low"
    }
  ],

  "${langForPrompt === 'tr' ? 'yokCompliance' : 'academicCompliance'}": {
    "score": <0-100>,
    "compliant": ["<${langForPrompt === 'tr' ? 'uyulan standart' : 'compliant standard'} 1>"],
    "nonCompliant": ["<${langForPrompt === 'tr' ? 'uyulmayan standart' : 'non-compliant standard'} 1>"]
  },

  "detectedInfo": {
    "thesisType": "<${langForPrompt === 'tr' ? 'yüksek lisans|doktora|lisans' : 'master|doctoral|bachelor'}>",
    "field": "<${langForPrompt === 'tr' ? 'alan adı' : 'field name'}>",
    "language": "<tr|en>",
    "citationStyle": "<APA|IEEE|Chicago|MLA|${langForPrompt === 'tr' ? 'Karma|Belirsiz' : 'Mixed|Unknown'}>"
  },

  "statistics": {
    "referenceCount": <${langForPrompt === 'tr' ? 'kaynakça bölümündeki kaynak sayısı - TEK TEK DİKKATLİCE SAY' : 'reference count - COUNT EACH ONE CAREFULLY'}>,
    "figureCount": <${langForPrompt === 'tr' ? 'şekil sayısı' : 'figure count'}>,
    "tableCount": <${langForPrompt === 'tr' ? 'tablo sayısı' : 'table count'}>
  }
}

${langPrompt.statisticsNote}

${langForPrompt === 'tr' ? 'SADECE JSON yanıt ver, başka açıklama ekleme.' : 'Respond ONLY with JSON, no additional explanation.'}`;

  try {
    let result;

    if (isPdf && pdfBase64) {
      // PDF modunda - doğrudan PDF'i gönder (görseller dahil)
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        },
        { text: analysisPrompt },
      ]);
      console.log(`[PREMIUM ANALYSIS] PDF sent to Gemini for multimodal analysis`);
    } else {
      // Metin modunda
      result = await model.generateContent(analysisPrompt);
    }

    const response = result.response.text();

    // JSON'u güvenli şekilde parse et
    let analysis;
    try {
      // Önce direkt JSON parse dene (prompt "SADECE JSON" diyor)
      analysis = JSON.parse(response.trim());
    } catch (directParseError) {
      // Fallback: Response içinden JSON'u çıkar
      // Non-greedy match kullan - en dıştaki JSON objesini al
      const jsonMatch = response.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
      if (!jsonMatch) {
        console.error('[PREMIUM ANALYSIS] Invalid response (no JSON found):', response.substring(0, 500));
        throw new Error('Gemini yanıtında geçerli JSON bulunamadı');
      }

      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (extractParseError) {
        console.error('[PREMIUM ANALYSIS] JSON parse failed:', extractParseError);
        console.error('[PREMIUM ANALYSIS] Extracted JSON:', jsonMatch[0].substring(0, 500));
        throw new Error(`JSON parse hatası: ${(extractParseError as Error).message}`);
      }
    }

    // Zorunlu alanları kontrol et
    if (!analysis.overallScore && analysis.overallScore !== 0) {
      console.warn('[PREMIUM ANALYSIS] Missing overallScore, using default');
      analysis.overallScore = 50;
    }

    // Sonucu formatla
    const finalResult: PremiumAnalysisResult = {
      overallScore: analysis.overallScore || 0,
      grade: analysis.grade || getGrade(analysis.overallScore || 0),
      executiveSummary: analysis.executiveSummary || '',

      sections: {
        structure: formatSection(analysis.sections?.structure),
        methodology: formatSection(analysis.sections?.methodology),
        literature: formatSection(analysis.sections?.literature),
        writingQuality: formatSection(analysis.sections?.writingQuality),
        references: formatSection(analysis.sections?.references),
        formatting: formatSection(analysis.sections?.formatting),
      },

      issues: {
        critical: formatIssues(analysis.issues?.critical, 'critical'),
        major: formatIssues(analysis.issues?.major, 'major'),
        minor: formatIssues(analysis.issues?.minor, 'minor'),
        formatting: formatIssues(analysis.issues?.formatting, 'formatting'),
      },

      strengths: analysis.strengths || [],
      priorityActions: formatPriorityActions(analysis.priorityActions),

      yokCompliance: {
        // Handle both yokCompliance (Turkish) and academicCompliance (English) keys
        score: analysis.yokCompliance?.score || analysis.academicCompliance?.score || 0,
        compliant: analysis.yokCompliance?.compliant || analysis.academicCompliance?.compliant || [],
        nonCompliant: analysis.yokCompliance?.nonCompliant || analysis.academicCompliance?.nonCompliant || [],
      },

      statistics: {
        // pageCount ve wordCount için önceden hesaplanmış değerleri kullan (daha doğru)
        // Gemini'nin tahmini yanlış olabiliyor
        pageCount: stats.pageCount || analysis.statistics?.pageCount || 0,
        wordCount: stats.wordCount || analysis.statistics?.wordCount || 0,
        characterCount: stats.characterCount || 0,
        // referenceCount, figureCount, tableCount için Gemini'nin saydığı değerleri kullan
        // (PDF'deki görselleri görebildiği için daha doğru)
        referenceCount: analysis.statistics?.referenceCount || countReferences(text) || 0,
        figureCount: analysis.statistics?.figureCount || countFigures(text) || 0,
        tableCount: analysis.statistics?.tableCount || countTables(text) || 0,
        averageSentenceLength: stats.averageSentenceLength || 0,
        readabilityScore: stats.readabilityScore || 50,
      },

      metadata: {
        analyzedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        modelUsed: 'gemini-3-pro',
        analysisVersion: '2.0',
        reportLanguage: reportLang,
      },
    };

    console.log(`[PREMIUM ANALYSIS] Completed in ${finalResult.metadata.processingTimeMs}ms`);

    return finalResult;

  } catch (error) {
    console.error('[PREMIUM ANALYSIS] Error:', error);
    throw error;
  }
}

// ============================================================================
// Görsel Analizi (Gemini Vision)
// ============================================================================

export async function analyzeImages(
  images: { page: number; base64: string; mimeType: string }[]
): Promise<{
  imageAnalysis: {
    page: number;
    type: 'figure' | 'table' | 'chart' | 'diagram' | 'other';
    description: string;
    issues: string[];
    suggestions: string[];
  }[];
}> {
  if (!images || images.length === 0) {
    return { imageAnalysis: [] };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
  });

  const imageAnalysis = [];

  for (const img of images.slice(0, 20)) { // Max 20 görsel
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64,
          },
        },
        `Bu akademik tezdeki görseli analiz et.

JSON formatında yanıt ver:
{
  "type": "figure|table|chart|diagram|other",
  "description": "<görselin ne anlattığı>",
  "issues": ["<sorun 1>", "<sorun 2>"],
  "suggestions": ["<öneri 1>", "<öneri 2>"],
  "captionQuality": "good|needs_improvement|missing",
  "academicQuality": "high|medium|low"
}

Kontrol et:
- Görsel kalitesi yeterli mi?
- Açıklama/başlık var mı ve yeterli mi?
- Akademik standartlara uygun mu?
- Metin ile tutarlı mı?`
      ]);

      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        imageAnalysis.push({
          page: img.page,
          ...parsed,
        });
      }
    } catch (err) {
      console.warn(`Image analysis failed for page ${img.page}:`, err);
    }
  }

  return { imageAnalysis };
}

// ============================================================================
// Yardımcı Fonksiyonlar
// ============================================================================

function calculateStatistics(text: string) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const characters = text.replace(/\s/g, '').length;
  const pageCount = Math.ceil(text.length / 2750);

  return {
    pageCount,
    wordCount: words.length,
    characterCount: characters,
    averageSentenceLength: Math.round(words.length / Math.max(sentences.length, 1)),
    readabilityScore: calculateReadability(text),
    referenceCount: 0,
    figureCount: 0,
    tableCount: 0,
  };
}

function calculateReadability(text: string): number {
  // Basit okunabilirlik skoru (Türkçe için adapte)
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = text.length / 3; // Yaklaşık

  if (words === 0 || sentences === 0) return 50;

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  // Flesch-Kincaid benzeri (Türkçe için ayarlanmış)
  const score = 100 - (avgWordsPerSentence * 1.5) - (avgSyllablesPerWord * 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function addPageMarkers(text: string): string {
  // Her ~2750 karakterde bir sayfa işaretleyicisi ekle
  const charsPerPage = 2750;
  let result = '';
  let pageNum = 1;

  for (let i = 0; i < text.length; i += charsPerPage) {
    result += `\n[SAYFA ${pageNum}]\n`;
    result += text.substring(i, Math.min(i + charsPerPage, text.length));
    pageNum++;
  }

  return result;
}

function countReferences(text: string): number {
  // Kaynakça bölümündeki kaynakları say
  const refSection = text.match(/kaynakça|references|bibliography/i);
  if (!refSection) return 0;

  const refText = text.substring(text.search(/kaynakça|references|bibliography/i));
  const refs = refText.match(/\n\s*[A-Za-z]/g);
  return refs ? refs.length : 0;
}

function countFigures(text: string): number {
  const matches = text.match(/şekil\s*\d+|figure\s*\d+|grafik\s*\d+/gi);
  return matches ? new Set(matches.map(m => m.toLowerCase())).size : 0;
}

function countTables(text: string): number {
  const matches = text.match(/tablo\s*\d+|table\s*\d+|çizelge\s*\d+/gi);
  return matches ? new Set(matches.map(m => m.toLowerCase())).size : 0;
}

function getGrade(score: number) {
  if (score >= 95) return { letter: 'A+', label: 'Mükemmel', color: '#10B981' };
  if (score >= 90) return { letter: 'A', label: 'Çok İyi', color: '#34D399' };
  if (score >= 85) return { letter: 'A-', label: 'İyi', color: '#6EE7B7' };
  if (score >= 80) return { letter: 'B+', label: 'Ortanın Üstü', color: '#FCD34D' };
  if (score >= 75) return { letter: 'B', label: 'Orta', color: '#FBBF24' };
  if (score >= 70) return { letter: 'B-', label: 'Kabul Edilebilir', color: '#F59E0B' };
  if (score >= 65) return { letter: 'C+', label: 'Zayıf', color: '#F97316' };
  if (score >= 60) return { letter: 'C', label: 'Yetersiz', color: '#EF4444' };
  return { letter: 'F', label: 'Başarısız', color: '#DC2626' };
}

function formatSection(section: any): SectionAnalysis {
  return {
    score: section?.score || 0,
    maxScore: 100,
    percentage: section?.score || 0,
    feedback: section?.feedback || '',
    strengths: section?.strengths || [],
    improvements: section?.improvements || [],
  };
}

function formatIssues(issues: any[], severity: string): PagedIssue[] {
  if (!issues || !Array.isArray(issues)) return [];

  return issues.map((issue, index) => ({
    id: `${severity}-${index + 1}`,
    title: issue.title || 'Sorun',
    description: issue.description || '',
    severity: severity as PagedIssue['severity'],
    category: issue.category || 'general',
    pageNumber: issue.pageNumber,
    location: issue.location,
    originalText: issue.originalText,
    suggestion: issue.suggestion || '',
    impact: issue.impact || '',
  }));
}

function formatPriorityActions(actions: any[]): PriorityAction[] {
  if (!actions || !Array.isArray(actions)) return [];

  return actions.map((action, index) => ({
    order: action.order || index + 1,
    action: action.action || '',
    reason: action.reason || '',
    estimatedImpact: action.estimatedImpact || 'medium',
    relatedIssues: action.relatedIssues || [],
  }));
}

// ============================================================================
// Export
// ============================================================================

export default {
  analyzePremium,
  analyzeImages,
};
