import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnalysisJob,
  verifyQStashSignature,
  setJobStatus,
  setJobResult,
  getJobResult,
  enqueueNextStep,
  PIPELINE_STEPS,
} from '@/app/lib/queue/qstash';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 120; // 2 dakika timeout

interface ExtractResult {
  text: string;
  wordCount: number;
}

interface AgentResult {
  agentId: string;
  agentName: string;
  weight: number;
  result: {
    score: number;
    issues: Array<{
      severity: string;
      description: string;
      suggestion?: string;
    }>;
    strengths: string[];
    feedback: string;
  };
}

interface DeepAnalyzeResult {
  agentResults: Record<string, AgentResult>;
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
    const { documentId } = job;

    console.log(`[CrossValidate] Starting for document: ${documentId}`);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 4,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
      status: 'running',
      progress: 10,
      startedAt: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 4,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
          progress: 10,
        },
      })
      .eq('id', documentId);

    // Önceki sonuçları al
    const extractResult = await getJobResult<ExtractResult>(documentId, 1);
    const deepAnalyzeResult = await getJobResult<DeepAnalyzeResult>(documentId, 3);

    if (!extractResult || !deepAnalyzeResult) {
      throw new Error('Önceki analiz sonuçları bulunamadı');
    }

    const { text } = extractResult;
    const { agentResults } = deepAnalyzeResult;

    // Gemini sonuçlarını özetle
    const geminiSummary = Object.values(agentResults).map((agent) => ({
      category: agent.agentName,
      score: agent.result.score,
      mainIssues: agent.result.issues.slice(0, 3),
      strengths: agent.result.strengths.slice(0, 2),
    }));

    // Claude ile çapraz doğrulama
    const crossValidationPrompt = `Sen deneyimli bir akademik tez değerlendirme uzmanısın. Başka bir AI sistemi (Gemini) tez analizi yaptı. Senin görevin bu analizi doğrulamak ve potansiyel tutarsızlıkları tespit etmek.

## Gemini Analiz Sonuçları:
${JSON.stringify(geminiSummary, null, 2)}

## Tez Metni (ilk 100.000 karakter):
${text.substring(0, 100000)}

## Görevlerin:
1. Gemini'nin her kategori için verdiği puanları değerlendir
2. Gözden kaçmış önemli sorunları tespit et
3. Yanlış veya abartılı değerlendirmeleri işaretle
4. Kendi bağımsız değerlendirmeni yap

JSON formatında yanıt ver:
{
  "validationResults": {
    "structure": {
      "geminiScore": number,
      "claudeScore": number,
      "agreement": "agree" | "partial" | "disagree",
      "adjustedScore": number,
      "reason": "açıklama"
    },
    "methodology": { ... },
    "writing": { ... },
    "references": { ... },
    "originality": { ... }
  },
  "missedIssues": [
    {
      "severity": "critical" | "major" | "minor",
      "category": string,
      "description": string,
      "suggestion": string
    }
  ],
  "overestimatedIssues": [
    {
      "originalIssue": string,
      "reason": "neden abartılı olduğu"
    }
  ],
  "calibratedOverallScore": number,
  "confidence": 0-100,
  "summary": "Genel çapraz doğrulama özeti (3-4 cümle)"
}`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: crossValidationPrompt,
        },
      ],
    });

    let crossValidation;
    const responseText = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text
      : '';

    try {
      // JSON'u bul ve parse et
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        crossValidation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON bulunamadı');
      }
    } catch {
      crossValidation = {
        validationResults: {},
        missedIssues: [],
        overestimatedIssues: [],
        calibratedOverallScore: calculateWeightedAverage(agentResults),
        confidence: 70,
        summary: 'Çapraz doğrulama kısmen tamamlandı.',
      };
    }

    // Progress güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 4,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
          progress: 80,
        },
      })
      .eq('id', documentId);

    // Kalibre edilmiş skorları hesapla
    const calibratedScores = calibrateScores(agentResults, crossValidation);

    // Sonuçları kaydet
    await setJobResult(documentId, 4, {
      crossValidation,
      calibratedScores,
      validatedAt: new Date().toISOString(),
    });

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 4,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: 4,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
          progress: 100,
        },
      })
      .eq('id', documentId);

    console.log(`[CrossValidate] Completed for document: ${documentId}`);

    // Rapor oluşturmaya geç
    await enqueueNextStep(job, '/api/jobs/generate-report');

    return NextResponse.json({
      success: true,
      documentId,
      confidence: crossValidation.confidence,
    });
  } catch (error) {
    console.error('[CrossValidate] Error:', error);

    let job: AnalysisJob | null = null;
    try {
      const body = await request.clone().text();
      job = JSON.parse(body);
    } catch {}

    if (job) {
      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: 4,
        totalSteps: job.totalSteps,
        stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });

      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: 4,
            totalSteps: job.totalSteps,
            stepName: PIPELINE_STEPS.CROSS_VALIDATE.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        })
        .eq('id', job.documentId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Çapraz doğrulama başarısız' },
      { status: 500 }
    );
  }
}

// Ağırlıklı ortalama hesapla
function calculateWeightedAverage(agentResults: Record<string, AgentResult>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const agent of Object.values(agentResults)) {
    weightedSum += agent.result.score * agent.weight;
    totalWeight += agent.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}

// Skorları kalibre et
function calibrateScores(
  agentResults: Record<string, AgentResult>,
  crossValidation: {
    validationResults?: Record<string, { adjustedScore?: number }>;
    calibratedOverallScore?: number;
  }
): Record<string, number> {
  const calibrated: Record<string, number> = {};

  for (const [agentId, agent] of Object.entries(agentResults)) {
    const validation = crossValidation.validationResults?.[agentId];
    if (validation?.adjustedScore !== undefined) {
      // Claude'un kalibre ettiği skoru kullan
      calibrated[agentId] = validation.adjustedScore;
    } else {
      // Orijinal skoru kullan
      calibrated[agentId] = agent.result.score;
    }
  }

  // Genel skor
  calibrated.overall = crossValidation.calibratedOverallScore || calculateWeightedAverage(agentResults);

  return calibrated;
}
