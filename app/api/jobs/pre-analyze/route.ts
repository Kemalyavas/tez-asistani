import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  AnalysisJob,
  verifyQStashSignature,
  setJobStatus,
  setJobResult,
  getJobResult,
  enqueueNextStep,
  PIPELINE_STEPS,
} from '@/app/lib/queue/qstash';
import { analyzeWithGemini } from '@/app/lib/gemini';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60; // 60 saniye timeout

interface ExtractResult {
  text: string;
  wordCount: number;
  charCount: number;
  estimatedPages: number;
  sections: Array<{ type: string; startIndex: number; title: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // QStash signature doğrulama
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      const isValid = await verifyQStashSignature(signature, body);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const job: AnalysisJob = JSON.parse(body);
    const { documentId, analysisTier } = job;

    console.log(`[PreAnalyze] Starting for document: ${documentId}`);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 2,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
      status: 'running',
      progress: 10,
      startedAt: new Date().toISOString(),
    });

    // Veritabanı durumunu güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 2,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
          progress: 10,
        },
      })
      .eq('id', documentId);

    // Önceki adımın sonucunu al
    const extractResult = await getJobResult<ExtractResult>(documentId, 1);
    if (!extractResult) {
      throw new Error('Metin çıkarma sonucu bulunamadı');
    }

    const { text, sections } = extractResult;

    // Hızlı yapı analizi - Gemini Flash ile
    const structurePrompt = `
Sen bir akademik tez yapısı analiz uzmanısın. Verilen tez metnini analiz et ve yapısal değerlendirme yap.

Metin (ilk 50.000 karakter):
${text.substring(0, 50000)}

Tespit edilen bölümler: ${JSON.stringify(sections)}

JSON formatında yanıt ver:
{
  "hasAbstract": boolean,
  "hasIntroduction": boolean,
  "hasLiteratureReview": boolean,
  "hasMethodology": boolean,
  "hasResults": boolean,
  "hasDiscussion": boolean,
  "hasConclusion": boolean,
  "hasReferences": boolean,
  "structureScore": 0-100,
  "structureIssues": ["sorun1", "sorun2"],
  "estimatedCitationCount": number,
  "citationStyle": "APA" | "IEEE" | "Chicago" | "MLA" | "Mixed" | "Unknown",
  "language": "tr" | "en" | "mixed",
  "academicLevel": "lisans" | "yuksek_lisans" | "doktora" | "unknown",
  "fieldOfStudy": string
}
`;

    const structureAnalysis = await analyzeWithGemini('flash',
      'Sen akademik tez yapısı analiz uzmanısın. Sadece JSON formatında yanıt ver.',
      structurePrompt,
      { jsonMode: true }
    );

    let parsedStructure;
    try {
      parsedStructure = JSON.parse(structureAnalysis);
    } catch {
      parsedStructure = {
        hasAbstract: sections.some(s => s.type === 'abstract'),
        hasIntroduction: sections.some(s => s.type === 'introduction'),
        hasLiteratureReview: sections.some(s => s.type === 'literature_review'),
        hasMethodology: sections.some(s => s.type === 'methodology'),
        hasResults: sections.some(s => s.type === 'results'),
        hasDiscussion: sections.some(s => s.type === 'discussion'),
        hasConclusion: sections.some(s => s.type === 'conclusion'),
        hasReferences: sections.some(s => s.type === 'references'),
        structureScore: 70,
        structureIssues: [],
        estimatedCitationCount: 0,
        citationStyle: 'Unknown',
        language: 'tr',
        academicLevel: 'unknown',
        fieldOfStudy: 'Bilinmiyor',
      };
    }

    // Kaynak listesi çıkarma
    const referencesPrompt = `
Verilen tez metninden kaynak listesini çıkar. Sadece kaynakça bölümündeki referansları listele.

Metin (son 30.000 karakter - kaynakça genelde sonda):
${text.substring(Math.max(0, text.length - 30000))}

JSON formatında yanıt ver:
{
  "references": [
    {
      "raw": "tam kaynak metni",
      "type": "article" | "book" | "thesis" | "website" | "conference" | "other",
      "year": number | null,
      "isRecent": boolean (son 5 yıl içinde mi)
    }
  ],
  "totalCount": number,
  "recentCount": number,
  "oldestYear": number | null,
  "newestYear": number | null,
  "typeDistribution": { "article": number, "book": number, ... }
}
`;

    const referencesAnalysis = await analyzeWithGemini('flash',
      'Sen akademik kaynak analiz uzmanısın. Sadece JSON formatında yanıt ver.',
      referencesPrompt,
      { jsonMode: true }
    );

    let parsedReferences;
    try {
      parsedReferences = JSON.parse(referencesAnalysis);
    } catch {
      parsedReferences = {
        references: [],
        totalCount: 0,
        recentCount: 0,
        oldestYear: null,
        newestYear: null,
        typeDistribution: {},
      };
    }

    // Sonuçları birleştir
    const preAnalyzeResult = {
      structure: parsedStructure,
      references: parsedReferences,
      metadata: {
        wordCount: extractResult.wordCount,
        estimatedPages: extractResult.estimatedPages,
        sectionCount: sections.length,
        language: parsedStructure.language,
        academicLevel: parsedStructure.academicLevel,
        fieldOfStudy: parsedStructure.fieldOfStudy,
      },
      preAnalyzedAt: new Date().toISOString(),
    };

    await setJobResult(documentId, 2, preAnalyzeResult);

    // Veritabanını güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 2,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
          progress: 100,
        },
      })
      .eq('id', documentId);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 2,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    console.log(`[PreAnalyze] Completed for document: ${documentId}`);

    // Sonraki adıma geç
    if (analysisTier === 'basic') {
      // Basic tier - direkt rapor oluştur
      await enqueueNextStep(job, '/api/jobs/generate-report');
    } else {
      // Standard/Comprehensive - derinlemesine analiz
      await enqueueNextStep(job, '/api/jobs/deep-analyze');
    }

    return NextResponse.json({
      success: true,
      documentId,
      structureScore: parsedStructure.structureScore,
      referenceCount: parsedReferences.totalCount,
    });
  } catch (error) {
    console.error('[PreAnalyze] Error:', error);

    let job: AnalysisJob | null = null;
    try {
      const body = await request.clone().text();
      job = JSON.parse(body);
    } catch {}

    if (job) {
      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: 2,
        totalSteps: job.totalSteps,
        stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });

      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: 2,
            totalSteps: job.totalSteps,
            stepName: PIPELINE_STEPS.PRE_ANALYZE.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        })
        .eq('id', job.documentId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ön analiz başarısız' },
      { status: 500 }
    );
  }
}
