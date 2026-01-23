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

export const maxDuration = 300; // 5 dakika timeout

interface ExtractResult {
  text: string;
  wordCount: number;
  charCount: number;
  estimatedPages: number;
  sections: Array<{ type: string; startIndex: number; title: string }>;
}

interface PreAnalyzeResult {
  structure: {
    hasAbstract: boolean;
    hasIntroduction: boolean;
    hasLiteratureReview: boolean;
    hasMethodology: boolean;
    hasResults: boolean;
    hasDiscussion: boolean;
    hasConclusion: boolean;
    hasReferences: boolean;
    structureScore: number;
    structureIssues: string[];
    language: string;
    academicLevel: string;
    fieldOfStudy: string;
  };
  references: {
    totalCount: number;
    recentCount: number;
  };
  metadata: {
    wordCount: number;
    estimatedPages: number;
  };
}

// Agent tanımları
interface Agent {
  id: string;
  name: string;
  model: 'flash' | 'pro';
  weight: number;
  systemPrompt: string;
  analysisPrompt: (text: string, context: PreAnalyzeResult) => string;
}

const AGENTS: Agent[] = [
  {
    id: 'structure',
    name: 'Yapı Analiz Ajanı',
    model: 'flash',
    weight: 0.20,
    systemPrompt: `Sen bir akademik tez yapısı ve organizasyon uzmanısın. YÖK (Yükseköğretim Kurulu) standartlarına göre tez yapısını değerlendiriyorsun.`,
    analysisPrompt: (text, context) => `
Verilen tez metninin YAPI ve ORGANİZASYON kalitesini değerlendir.

Değerlendirme kriterleri:
1. Giriş kalitesi (problem tanımı, amaç, kapsam) - max 20 puan
2. Literatür taraması kapsamlılığı - max 20 puan
3. Metodoloji sunumu netliği - max 20 puan
4. Bulgular organizasyonu - max 20 puan
5. Sonuç ve tartışma bütünlüğü - max 20 puan

Mevcut yapı bilgisi:
${JSON.stringify(context.structure, null, 2)}

Tez metni (ilk 80.000 karakter):
${text.substring(0, 80000)}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "subScores": {
    "introduction": 0-20,
    "literature": 0-20,
    "methodology": 0-20,
    "results": 0-20,
    "conclusion": 0-20
  },
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel değerlendirme (2-3 cümle)"
}
`,
  },
  {
    id: 'methodology',
    name: 'Metodoloji Analiz Ajanı',
    model: 'pro',
    weight: 0.30,
    systemPrompt: `Sen bir araştırma metodolojisi uzmanısın. Akademik araştırma tasarımı, veri toplama yöntemleri ve analiz tekniklerini değerlendiriyorsun.`,
    analysisPrompt: (text, context) => `
Verilen tez metninin METODOLOJİ kalitesini değerlendir.

Değerlendirme kriterleri:
1. Araştırma tasarımı uygunluğu - max 20 puan
2. Örneklem seçimi ve gerekçesi - max 15 puan
3. Veri toplama yöntemleri - max 20 puan
4. Analiz tekniklerinin uygunluğu - max 20 puan
5. Geçerlilik ve güvenilirlik önlemleri - max 15 puan
6. Sınırlılıkların farkındalığı - max 10 puan

Alan: ${context.structure.fieldOfStudy}
Seviye: ${context.structure.academicLevel}

Tez metni (tam metin):
${text}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "subScores": {
    "researchDesign": 0-20,
    "sampling": 0-15,
    "dataCollection": 0-20,
    "analysisMethod": 0-20,
    "validityReliability": 0-15,
    "limitations": 0-10
  },
  "researchType": "nicel" | "nitel" | "karma",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel metodoloji değerlendirmesi (3-4 cümle)"
}
`,
  },
  {
    id: 'writing',
    name: 'Yazım Kalitesi Ajanı',
    model: 'pro',
    weight: 0.25,
    systemPrompt: `Sen bir akademik yazım ve dil uzmanısın. Türkçe ve İngilizce akademik metinlerde dil kullanımı, argümantasyon ve tutarlılık değerlendiriyorsun.`,
    analysisPrompt: (text, context) => `
Verilen tez metninin YAZIM KALİTESİNİ değerlendir.

Değerlendirme kriterleri:
1. Akademik dil ve üslup - max 20 puan
2. Argümantasyon gücü - max 20 puan
3. Kanıt kullanımı ve destekleme - max 20 puan
4. Tutarlılık ve mantıksal akış - max 20 puan
5. Dilbilgisi ve imla - max 10 puan
6. Teknik terminoloji doğruluğu - max 10 puan

Dil: ${context.structure.language}
Alan: ${context.structure.fieldOfStudy}

Tez metni (tam metin):
${text}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "subScores": {
    "academicStyle": 0-20,
    "argumentation": 0-20,
    "evidenceUse": 0-20,
    "coherence": 0-20,
    "grammar": 0-10,
    "terminology": 0-10
  },
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa/paragraf bilgisi",
      "suggestion": "düzeltme önerisi",
      "example": "örnek hatalı cümle (varsa)"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel yazım değerlendirmesi (3-4 cümle)"
}
`,
  },
  {
    id: 'references',
    name: 'Kaynak Analiz Ajanı',
    model: 'flash',
    weight: 0.15,
    systemPrompt: `Sen bir akademik kaynak ve atıf uzmanısın. APA, IEEE, Chicago gibi atıf formatlarını ve kaynak kalitesini değerlendiriyorsun.`,
    analysisPrompt: (text, context) => `
Verilen tez metninin KAYNAKLAR ve ATIF kalitesini değerlendir.

Değerlendirme kriterleri:
1. Kaynak çeşitliliği ve kalitesi - max 25 puan
2. Güncel literatür kullanımı (son 5 yıl) - max 25 puan
3. Atıf formatı tutarlılığı - max 20 puan
4. Metin içi atıf kullanımı - max 20 puan
5. Kaynakça-metin uyumu - max 10 puan

Mevcut kaynak bilgisi:
Toplam kaynak: ${context.references.totalCount}
Güncel kaynak (son 5 yıl): ${context.references.recentCount}

Tez metni (tam metin):
${text}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "subScores": {
    "sourceDiversity": 0-25,
    "recency": 0-25,
    "formatConsistency": 0-20,
    "inTextCitations": 0-20,
    "bibliographyMatch": 0-10
  },
  "detectedStyle": "APA" | "IEEE" | "Chicago" | "MLA" | "Mixed" | "Unknown",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "kaynak/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel kaynak değerlendirmesi (2-3 cümle)"
}
`,
  },
  {
    id: 'originality',
    name: 'Özgünlük Ajanı',
    model: 'pro',
    weight: 0.10,
    systemPrompt: `Sen bir akademik özgünlük ve katkı değerlendirme uzmanısın. Araştırmanın literatüre katkısını ve özgün bakış açısını değerlendiriyorsun.`,
    analysisPrompt: (text, context) => `
Verilen tez metninin ÖZGÜNLÜK ve AKADEMİK KATKI düzeyini değerlendir.

Değerlendirme kriterleri:
1. Araştırma sorusunun özgünlüğü - max 30 puan
2. Literatüre katkı - max 30 puan
3. Pratik uygulanabilirlik - max 20 puan
4. Gelecek araştırma önerileri - max 20 puan

Alan: ${context.structure.fieldOfStudy}
Seviye: ${context.structure.academicLevel}

Tez metni (tam metin):
${text}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "subScores": {
    "researchQuestion": 0-30,
    "contribution": 0-30,
    "applicability": 0-20,
    "futureResearch": 0-20
  },
  "contributionType": "theoretical" | "practical" | "methodological" | "mixed",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "suggestion": "geliştirme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel özgünlük değerlendirmesi (2-3 cümle)"
}
`,
  },
];

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

    console.log(`[DeepAnalyze] Starting for document: ${documentId}`);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 3,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
      status: 'running',
      progress: 5,
      startedAt: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 3,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
          progress: 5,
        },
      })
      .eq('id', documentId);

    // Önceki adımların sonuçlarını al
    const extractResult = await getJobResult<ExtractResult>(documentId, 1);
    const preAnalyzeResult = await getJobResult<PreAnalyzeResult>(documentId, 2);

    if (!extractResult || !preAnalyzeResult) {
      throw new Error('Önceki analiz sonuçları bulunamadı');
    }

    const { text } = extractResult;

    // Multi-Agent paralel analiz
    const agentResults: Record<string, unknown> = {};
    const totalAgents = AGENTS.length;
    let completedAgents = 0;

    // Agent'ları paralel çalıştır
    const agentPromises = AGENTS.map(async (agent) => {
      try {
        console.log(`[DeepAnalyze] Running agent: ${agent.id}`);

        const prompt = agent.analysisPrompt(text, preAnalyzeResult);
        const response = await analyzeWithGemini(
          agent.model,
          agent.systemPrompt,
          prompt,
          { jsonMode: true }
        );

        let parsed;
        try {
          parsed = JSON.parse(response);
        } catch {
          parsed = { score: 50, issues: [], strengths: [], feedback: 'Analiz tamamlanamadı' };
        }

        completedAgents++;

        // Progress güncelle
        const progress = Math.round((completedAgents / totalAgents) * 80) + 10;
        await supabaseAdmin
          .from('thesis_documents')
          .update({
            processing_status: {
              step: 3,
              totalSteps: job.totalSteps,
              stepName: `${agent.name} tamamlandı`,
              progress,
            },
          })
          .eq('id', documentId);

        return {
          agentId: agent.id,
          agentName: agent.name,
          model: agent.model,
          weight: agent.weight,
          result: parsed,
        };
      } catch (error) {
        console.error(`[DeepAnalyze] Agent ${agent.id} failed:`, error);
        return {
          agentId: agent.id,
          agentName: agent.name,
          model: agent.model,
          weight: agent.weight,
          result: {
            score: 50,
            issues: [],
            strengths: [],
            feedback: `${agent.name} analizi tamamlanamadı`,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        };
      }
    });

    const results = await Promise.all(agentPromises);

    // Sonuçları kaydet
    for (const result of results) {
      agentResults[result.agentId] = result;

      // Agent sonucunu veritabanına kaydet
      await supabaseAdmin.from('agent_results').insert({
        document_id: documentId,
        agent_id: result.agentId,
        model_used: result.model === 'flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
        raw_response: result.result,
        parsed_score: result.result.score,
        issues: result.result.issues || [],
        strengths: result.result.strengths || [],
      });
    }

    // Sonuçları Redis'e kaydet
    await setJobResult(documentId, 3, {
      agentResults,
      analyzedAt: new Date().toISOString(),
    });

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 3,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 3,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
          progress: 100,
        },
      })
      .eq('id', documentId);

    console.log(`[DeepAnalyze] Completed for document: ${documentId}`);

    // Sonraki adıma geç
    if (analysisTier === 'comprehensive') {
      // Comprehensive tier - çapraz doğrulama
      await enqueueNextStep(job, '/api/jobs/cross-validate');
    } else {
      // Standard tier - direkt rapor oluştur
      await enqueueNextStep(job, '/api/jobs/generate-report');
    }

    return NextResponse.json({
      success: true,
      documentId,
      agentsCompleted: results.length,
    });
  } catch (error) {
    console.error('[DeepAnalyze] Error:', error);

    let job: AnalysisJob | null = null;
    try {
      const body = await request.clone().text();
      job = JSON.parse(body);
    } catch {}

    if (job) {
      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: 3,
        totalSteps: job.totalSteps,
        stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });

      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: 3,
            totalSteps: job.totalSteps,
            stepName: PIPELINE_STEPS.DEEP_ANALYZE.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        })
        .eq('id', job.documentId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Derinlemesine analiz başarısız' },
      { status: 500 }
    );
  }
}
