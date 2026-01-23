import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  AnalysisJob,
  verifyQStashSignature,
  setJobStatus,
  setJobResult,
  enqueueNextStep,
  PIPELINE_STEPS,
} from '@/app/lib/queue/qstash';
import { extractPdfText } from '@/app/lib/fileUtils';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60; // 60 saniye timeout

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
    const { documentId, filePath, fileName } = job;

    console.log(`[Extract] Starting for document: ${documentId}`);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 1,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
      status: 'running',
      progress: 10,
      startedAt: new Date().toISOString(),
    });

    // Veritabanı durumunu güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        status: 'processing',
        processing_status: {
          step: 1,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
          progress: 10,
        },
      })
      .eq('id', documentId);

    // Dosyayı indir
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('thesis-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Dosya indirilemedi: ${downloadError?.message}`);
    }

    // Buffer'a çevir
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Metin çıkar
    let extractedText = '';
    const fileExtension = fileName.toLowerCase().split('.').pop();

    if (fileExtension === 'pdf') {
      extractedText = await extractPdfText(buffer);
    } else if (fileExtension === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new Error('Desteklenmeyen dosya formatı');
    }

    if (!extractedText || extractedText.trim().length < 100) {
      throw new Error('Dosyadan metin çıkarılamadı veya içerik çok kısa');
    }

    // İstatistikleri hesapla
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    const charCount = extractedText.length;
    const estimatedPages = Math.ceil(charCount / 2750);

    // Bölüm tespiti yap
    const sections = detectSections(extractedText);

    // Sonuçları kaydet
    const extractResult = {
      text: extractedText,
      wordCount,
      charCount,
      estimatedPages,
      sections,
      extractedAt: new Date().toISOString(),
    };

    await setJobResult(documentId, 1, extractResult);

    // Veritabanını güncelle
    await supabaseAdmin
      .from('thesis_documents')
      .update({
        word_count: wordCount,
        page_count: estimatedPages,
        processing_status: {
          step: 1,
          totalSteps: job.totalSteps,
          stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
          progress: 100,
        },
      })
      .eq('id', documentId);

    // Durumu güncelle
    await setJobStatus(documentId, {
      documentId,
      step: 1,
      totalSteps: job.totalSteps,
      stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    console.log(`[Extract] Completed for document: ${documentId}, words: ${wordCount}`);

    // Sonraki adıma geç
    await enqueueNextStep(job, '/api/jobs/pre-analyze');

    return NextResponse.json({
      success: true,
      documentId,
      wordCount,
      estimatedPages,
      sectionsFound: sections.length,
    });
  } catch (error) {
    console.error('[Extract] Error:', error);

    // Parse body for error handling
    let job: AnalysisJob | null = null;
    try {
      const body = await request.clone().text();
      job = JSON.parse(body);
    } catch {}

    if (job) {
      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: 1,
        totalSteps: job.totalSteps,
        stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });

      // Veritabanı durumunu güncelle
      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: 1,
            totalSteps: job.totalSteps,
            stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          },
        })
        .eq('id', job.documentId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Metin çıkarma başarısız' },
      { status: 500 }
    );
  }
}

// Bölüm tespit fonksiyonu
function detectSections(text: string): Array<{ type: string; startIndex: number; title: string }> {
  const sections: Array<{ type: string; startIndex: number; title: string }> = [];

  const sectionPatterns = [
    { type: 'abstract', patterns: [/özet/i, /abstract/i] },
    { type: 'introduction', patterns: [/giriş/i, /introduction/i, /1\.\s*(giriş|introduction)/i] },
    { type: 'literature_review', patterns: [/literatür\s*(taraması|inceleme)/i, /literature\s*review/i, /2\.\s*(literatür|kavramsal)/i] },
    { type: 'methodology', patterns: [/yöntem/i, /metodoloji/i, /method(ology)?/i, /3\.\s*(yöntem|araştırma)/i] },
    { type: 'results', patterns: [/bulgular/i, /results/i, /findings/i, /4\.\s*(bulgular|results)/i] },
    { type: 'discussion', patterns: [/tartışma/i, /discussion/i, /5\.\s*(tartışma|discussion)/i] },
    { type: 'conclusion', patterns: [/sonuç/i, /conclusion/i, /6\.\s*(sonuç|conclusion)/i] },
    { type: 'references', patterns: [/kaynakça/i, /kaynaklar/i, /references/i, /bibliography/i] },
  ];

  for (const { type, patterns } of sectionPatterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        sections.push({
          type,
          startIndex: match.index,
          title: match[0],
        });
        break;
      }
    }
  }

  // Sırala
  sections.sort((a, b) => a.startIndex - b.startIndex);

  return sections;
}
