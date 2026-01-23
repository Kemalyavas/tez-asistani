import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  AnalysisJob,
  verifyQStashSignature,
  setJobStatus,
  getJobResult,
  cleanupJob,
  PIPELINE_STEPS,
} from '@/app/lib/queue/qstash';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60; // 60 saniye timeout

// Not skalası
const GRADE_SCALE = {
  'A+': { min: 95, max: 100, label: 'Mükemmel', color: '#10B981' },
  'A':  { min: 90, max: 94,  label: 'Çok İyi', color: '#34D399' },
  'A-': { min: 85, max: 89,  label: 'İyi', color: '#6EE7B7' },
  'B+': { min: 80, max: 84,  label: 'Ortanın Üstü', color: '#FCD34D' },
  'B':  { min: 75, max: 79,  label: 'Orta', color: '#FBBF24' },
  'B-': { min: 70, max: 74,  label: 'Kabul Edilebilir', color: '#F59E0B' },
  'C+': { min: 65, max: 69,  label: 'Zayıf', color: '#F97316' },
  'C':  { min: 60, max: 64,  label: 'Yetersiz', color: '#EF4444' },
  'F':  { min: 0,  max: 59,  label: 'Başarısız', color: '#DC2626' },
} as const;

function getGrade(score: number): { letter: string; label: string; color: string } {
  for (const [letter, grade] of Object.entries(GRADE_SCALE)) {
    if (score >= grade.min && score <= grade.max) {
      return { letter, label: grade.label, color: grade.color };
    }
  }
  return { letter: 'F', label: 'Başarısız', color: '#DC2626' };
}

interface PreAnalyzeResult {
  structure: {
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

interface AgentResult {
  agentId: string;
  agentName: string;
  weight: number;
  result: {
    score: number;
    subScores?: Record<string, number>;
    issues: Array<{
      severity: string;
      description: string;
      location?: string;
      suggestion?: string;
    }>;
    strengths: string[];
    feedback: string;
  };
}

interface CrossValidateResult {
  calibratedScores: Record<string, number>;
  crossValidation: {
    missedIssues?: Array<{
      severity: string;
      category: string;
      description: string;
      suggestion?: string;
    }>;
    summary?: string;
  };
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
    const { documentId, analysisTier, userId } = job;

    console.log(`[GenerateReport] Starting for document: ${documentId}`);

    // Durumu güncelle
    const reportStep = analysisTier === 'comprehensive' ? 5 : analysisTier === 'standard' ? 4 : 3;

    await setJobStatus(documentId, {
      documentId,
      step: reportStep,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
      status: 'running',
      progress: 10,
      startedAt: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('thesis_documents')
      .update({
        processing_status: {
          step: reportStep,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
          progress: 10,
        },
      })
      .eq('id', documentId);

    // Tüm sonuçları topla
    const preAnalyzeResult = await getJobResult<PreAnalyzeResult>(documentId, 2);
    const deepAnalyzeResult = await getJobResult<{ agentResults: Record<string, AgentResult> }>(documentId, 3);
    const crossValidateResult = await getJobResult<CrossValidateResult>(documentId, 4);

    if (!preAnalyzeResult) {
      throw new Error('Ön analiz sonuçları bulunamadı');
    }

    // Skorları hesapla
    let categoryScores: Record<string, { score: number; feedback: string }> = {};
    let allIssues: Array<{
      severity: string;
      category: string;
      description: string;
      location?: string;
      suggestion?: string;
    }> = [];
    let allStrengths: string[] = [];
    let overallScore = 0;

    if (analysisTier === 'basic') {
      // Basic tier - sadece ön analiz sonuçlarını kullan
      overallScore = preAnalyzeResult.structure.structureScore;
      categoryScores = {
        structure: {
          score: preAnalyzeResult.structure.structureScore,
          feedback: 'Temel yapı analizi tamamlandı.',
        },
      };
      allIssues = preAnalyzeResult.structure.structureIssues.map((issue) => ({
        severity: 'minor',
        category: 'structure',
        description: issue,
      }));
    } else {
      // Standard/Comprehensive tier - agent sonuçlarını kullan
      if (deepAnalyzeResult?.agentResults) {
        const agentMapping: Record<string, string> = {
          structure: 'structure',
          methodology: 'methodology',
          writing: 'writing_quality',
          references: 'references',
          originality: 'originality',
        };

        for (const [agentId, agent] of Object.entries(deepAnalyzeResult.agentResults)) {
          const categoryKey = agentMapping[agentId] || agentId;

          // Kalibre edilmiş skor varsa kullan
          const score = crossValidateResult?.calibratedScores?.[agentId] || agent.result.score;

          categoryScores[categoryKey] = {
            score,
            feedback: agent.result.feedback,
          };

          // Issues
          for (const issue of agent.result.issues) {
            allIssues.push({
              ...issue,
              category: categoryKey,
            });
          }

          // Strengths
          allStrengths.push(...agent.result.strengths);
        }

        // Çapraz doğrulama sonuçlarından eksik sorunları ekle
        if (crossValidateResult?.crossValidation?.missedIssues) {
          for (const issue of crossValidateResult.crossValidation.missedIssues) {
            allIssues.push(issue);
          }
        }

        // Ağırlıklı genel skor
        overallScore = crossValidateResult?.calibratedScores?.overall ||
          calculateWeightedScore(deepAnalyzeResult.agentResults);
      }
    }

    // Issues'ları severity'ye göre sırala
    const severityOrder = { critical: 0, major: 1, minor: 2 };
    allIssues.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
      (severityOrder[b.severity as keyof typeof severityOrder] || 3));

    // Grade hesapla
    const grade = getGrade(overallScore);

    // Final rapor
    const analysisResult = {
      overallScore,
      grade: {
        letter: grade.letter,
        label: grade.label,
        color: grade.color,
      },
      categoryScores,
      issues: {
        critical: allIssues.filter((i) => i.severity === 'critical'),
        major: allIssues.filter((i) => i.severity === 'major'),
        minor: allIssues.filter((i) => i.severity === 'minor'),
        total: allIssues.length,
      },
      strengths: [...new Set(allStrengths)].slice(0, 10),
      metadata: {
        wordCount: preAnalyzeResult.metadata.wordCount,
        pageCount: preAnalyzeResult.metadata.estimatedPages,
        language: preAnalyzeResult.structure.language,
        academicLevel: preAnalyzeResult.structure.academicLevel,
        fieldOfStudy: preAnalyzeResult.structure.fieldOfStudy,
        referenceCount: preAnalyzeResult.references.totalCount,
        recentReferenceCount: preAnalyzeResult.references.recentCount,
      },
      recommendations: generateRecommendations(allIssues, categoryScores),
      immediateActions: allIssues
        .filter((i) => i.severity === 'critical')
        .slice(0, 5)
        .map((i) => i.suggestion || i.description),
      analysisTier,
      analyzedAt: new Date().toISOString(),
      crossValidated: analysisTier === 'comprehensive',
    };

    // Veritabanını güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        status: 'analyzed',
        analysis_result: analysisResult,
        overall_score: overallScore,
        analyzed_at: new Date().toISOString(),
        processing_status: {
          step: reportStep,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
          progress: 100,
          status: 'completed',
        },
      })
      .eq('id', documentId);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: reportStep,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    // Kullanıcı istatistiklerini güncelle
    await supabaseAdmin
      .from('profiles')
      .update({
        thesis_analyses_count: supabaseAdmin.rpc('increment_counter', {
          row_id: userId,
          counter_name: 'thesis_analyses_count',
        }),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Redis'teki geçici verileri temizle
    await cleanupJob(documentId);

    console.log(`[GenerateReport] Completed for document: ${documentId}, score: ${overallScore}`);

    return NextResponse.json({
      success: true,
      documentId,
      overallScore,
      grade: grade.letter,
    });
  } catch (error) {
    console.error('[GenerateReport] Error:', error);

    let job: AnalysisJob | null = null;
    try {
      const body = await request.clone().text();
      job = JSON.parse(body);
    } catch {}

    if (job) {
      const reportStep = job.analysisTier === 'comprehensive' ? 5 : job.analysisTier === 'standard' ? 4 : 3;

      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: reportStep,
        totalSteps: job.totalSteps,
        stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });

      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: reportStep,
            totalSteps: job.totalSteps,
            stepName: PIPELINE_STEPS.GENERATE_REPORT.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        })
        .eq('id', job.documentId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rapor oluşturma başarısız' },
      { status: 500 }
    );
  }
}

// Ağırlıklı skor hesapla
function calculateWeightedScore(agentResults: Record<string, AgentResult>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const agent of Object.values(agentResults)) {
    weightedSum += agent.result.score * agent.weight;
    totalWeight += agent.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}

// Öneriler oluştur
function generateRecommendations(
  issues: Array<{ severity: string; category: string; description: string }>,
  categoryScores: Record<string, { score: number }>
): string[] {
  const recommendations: string[] = [];

  // En düşük skorlu kategoriler için öneriler
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => a.score - b.score);

  for (const [category, { score }] of sortedCategories.slice(0, 3)) {
    if (score < 70) {
      const categoryNames: Record<string, string> = {
        structure: 'Yapı ve organizasyon',
        methodology: 'Metodoloji',
        writing_quality: 'Yazım kalitesi',
        references: 'Kaynakça',
        originality: 'Özgünlük',
      };

      recommendations.push(
        `${categoryNames[category] || category} kategorisinde iyileştirme yapılması önerilir (Mevcut: ${score}/100).`
      );
    }
  }

  // Kritik sorunlar için öneriler
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push(
      `${criticalIssues.length} kritik sorun tespit edildi. Bunların teslimden önce düzeltilmesi gerekiyor.`
    );
  }

  // Genel öneriler
  if (recommendations.length === 0) {
    recommendations.push('Teziniz genel olarak iyi durumda. Küçük iyileştirmelerle daha da güçlendirilebilir.');
  }

  return recommendations.slice(0, 5);
}
