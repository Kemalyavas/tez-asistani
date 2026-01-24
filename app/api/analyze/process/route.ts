// app/api/analyze/process/route.ts
// ============================================================================
// Process Analysis - Premium AI analysis with Gemini Pro
// - Full document analysis (up to 500K characters)
// - Page-specific feedback
// - YÖK standards compliance check
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extractPdfText } from '../../../lib/fileUtils';
import { isAdmin } from '../../../lib/adminUtils';
import { analyzePremium, PremiumAnalysisResult } from '../../../lib/thesis/premiumAnalysisService';

// Extend timeout for this route (Vercel Pro: up to 300s)
export const maxDuration = 300; // 5 minutes

// ============================================================================
// Helper Functions
// ============================================================================

function estimatePageCount(text: string): number {
  const charsPerPage = 2750;
  return Math.ceil(text.length / charsPerPage);
}

function getWordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let timeoutOccurred = false;
  let timeoutTimer: NodeJS.Timeout | null = null;

  try {
    // Set timeout guard (280s = 4m 40s, before 300s Vercel limit)
    const TIMEOUT_MS = 280000; // 280 seconds
    timeoutTimer = setTimeout(() => {
      timeoutOccurred = true;
    }, TIMEOUT_MS);

    // Authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get parameters
    const body = await request.json();
    const { documentId, filePath, fileName, reportLanguage = 'auto' } = body;

    if (!documentId || !filePath || !fileName) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check timeout before heavy operations
    if (timeoutOccurred) {
      console.error(`[ANALYZE/PROCESS] Timeout occurred during initialization`);
      await markAsFailedWithTimeout(supabase, documentId, user.id, 0);
      return NextResponse.json(
        { error: 'Analysis timeout - document too large. Please try with a smaller file.' },
        { status: 504 }
      );
    }

    // Verify document belongs to user and is in processing state
    const { data: doc, error: docError } = await supabase
      .from('thesis_documents')
      .select('id, user_id, status, analysis_type, credits_used')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      console.error('Document not found:', docError);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (doc.user_id !== user.id) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (doc.status !== 'processing') {
      // Already processed or failed
      if (timeoutTimer) clearTimeout(timeoutTimer);
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        status: doc.status
      });
    }

    console.log(`[ANALYZE/PROCESS] Starting analysis for document: ${documentId}`);

    // Check timeout
    if (timeoutOccurred) {
      console.error(`[ANALYZE/PROCESS] Timeout before file download`);
      await markAsFailedWithTimeout(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Analysis timeout - document too large' },
        { status: 504 }
      );
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('thesis-files')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Could not download file' },
        { status: 500 }
      );
    }

    // Dosya türü ve buffer
    const isDocx = fileName.toLowerCase().endsWith('.docx');
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const bytes = await fileData.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // PDF için: Doğrudan Gemini'ye gönderilecek (multimodal - görseller dahil)
    // DOCX için: Metin çıkarılacak
    let text = '';
    let useDirectPdf = false;

    try {
      if (isDocx) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (isPdf) {
        // PDF boyutu kontrol et (50MB altındaysa doğrudan gönder)
        const pdfSizeMB = buffer.length / 1024 / 1024;

        if (pdfSizeMB <= 50) {
          // PDF'i doğrudan Gemini'ye gönder - görseller, tablolar, grafikler dahil
          useDirectPdf = true;
          console.log(`[ANALYZE/PROCESS] PDF Direct Mode enabled - ${pdfSizeMB.toFixed(2)} MB (images will be analyzed)`);

          // İstatistikler için yine metin çıkar (opsiyonel)
          try {
            text = await extractPdfText(buffer);
          } catch {
            // Metin çıkarılamasa bile devam et - Gemini okuyacak
            text = '[PDF içeriği Gemini tarafından doğrudan okunacak]';
            console.log(`[ANALYZE/PROCESS] Text extraction failed, but PDF will be sent directly to Gemini`);
          }
        } else {
          // Çok büyük PDF - sadece metin modu
          console.log(`[ANALYZE/PROCESS] PDF too large for direct mode (${pdfSizeMB.toFixed(2)} MB), using text extraction`);
          text = await extractPdfText(buffer);
        }
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Could not parse document' },
        { status: 500 }
      );
    }

    // PDF direct mode'da metin kontrolü atla
    if (!useDirectPdf && (!text || text.length < 1000)) {
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Document too short' },
        { status: 400 }
      );
    }

    // İstatistikler için metin varsa kullan, yoksa buffer boyutundan tahmin et
    const hasExtractedText = text && text.length > 100 && !text.includes('[PDF içeriği Gemini');
    const pageCount = hasExtractedText ? estimatePageCount(text) : Math.ceil(buffer.length / 50000);
    const wordCount = hasExtractedText ? getWordCount(text) : 0;
    const analysisTier = doc.analysis_type;

    console.log(`[ANALYZE/PROCESS] Mode: ${useDirectPdf ? 'PDF Direct (with images)' : 'Text'}, Pages: ~${pageCount}, Words: ${wordCount}, Tier: ${analysisTier}`);

    // Check timeout before heavy analysis
    if (timeoutOccurred) {
      console.error(`[ANALYZE/PROCESS] Timeout before analysis - ${pageCount} pages, ${wordCount} words`);
      await markAsFailedWithTimeout(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: `Analysis timeout - document too large (${pageCount} pages). Please try with a smaller file.` },
        { status: 504 }
      );
    }

    // Perform Premium Analysis with Gemini Pro
    let analysisResult: PremiumAnalysisResult;

    try {
      console.log(`[ANALYZE/PROCESS] Starting Premium Analysis with Gemini ${useDirectPdf ? '(PDF Direct - images included)' : '(Text mode)'}...`);

      if (useDirectPdf) {
        // PDF DIRECT MODE: Buffer'ı doğrudan gönder
        // Gemini tüm görselleri, tabloları, grafikleri görecek
        analysisResult = await analyzePremium(buffer, {
          fileName,
          isPdf: true,
          includeImages: true,
          // Metin çıkarılabildiyse hesaplanmış istatistikleri geç
          preCalculatedStats: hasExtractedText ? { pageCount, wordCount } : undefined,
          // Rapor dili: 'tr', 'en', veya 'auto' (tez diliyle aynı)
          reportLanguage: reportLanguage as 'tr' | 'en' | 'auto',
        });
      } else {
        // TEXT MODE: Sadece metin gönder
        // Gemini Pro 1M token işleyebilir - 500K karakter güvenli limit
        const maxChars = 500000;
        const analysisText = text.length > maxChars
          ? text.substring(0, maxChars) + '\n\n[...Dökümanın geri kalanı boyut sınırı nedeniyle kesildi...]'
          : text;

        if (text.length > maxChars) {
          console.log(`[ANALYZE/PROCESS] Text truncated: ${text.length} -> ${maxChars} chars`);
        }

        // Premium analiz yap (Gemini Pro ile)
        analysisResult = await analyzePremium(analysisText, {
          fileName,
          isPdf: false,
          // Rapor dili: 'tr', 'en', veya 'auto' (tez diliyle aynı)
          reportLanguage: reportLanguage as 'tr' | 'en' | 'auto',
        });
      }

      // Update thesis document with Premium results
      const updateData = {
        status: 'analyzed',
        analysis_result: {
          // Yeni Premium format
          overallScore: analysisResult.overallScore,
          overall_score: analysisResult.overallScore,
          grade: analysisResult.grade,
          gradeCategory: analysisResult.grade.label,
          grade_category: analysisResult.grade.label,
          summary: analysisResult.executiveSummary,
          executiveSummary: analysisResult.executiveSummary,

          // Bölüm skorları (hem yeni hem eski format)
          sections: analysisResult.sections,
          categoryScores: {
            structure: analysisResult.sections.structure,
            methodology: analysisResult.sections.methodology,
            writingQuality: analysisResult.sections.writingQuality,
            references: analysisResult.sections.references,
            literature: analysisResult.sections.literature,
            formatting: analysisResult.sections.formatting,
          },
          category_scores: {
            structure: analysisResult.sections.structure,
            methodology: analysisResult.sections.methodology,
            writing_quality: analysisResult.sections.writingQuality,
            references: analysisResult.sections.references,
          },

          // Sorunlar (sayfa numaralı)
          issues: analysisResult.issues,
          criticalIssues: analysisResult.issues.critical,
          critical_issues: analysisResult.issues.critical,
          majorIssues: analysisResult.issues.major,
          major_issues: analysisResult.issues.major,
          minorIssues: analysisResult.issues.minor,
          minor_issues: analysisResult.issues.minor,
          formattingIssues: analysisResult.issues.formatting,

          // Güçlü yönler ve öneriler
          strengths: analysisResult.strengths,
          priorityActions: analysisResult.priorityActions,
          immediateActions: analysisResult.priorityActions.map(a => a.action),
          immediate_actions: analysisResult.priorityActions.map(a => a.action),
          recommendations: analysisResult.priorityActions.map(a => `${a.action}: ${a.reason}`),

          // YÖK uyumluluk
          yokCompliance: analysisResult.yokCompliance,

          // İstatistikler
          statistics: analysisResult.statistics,
          metadata: analysisResult.metadata,
        },
        overall_score: analysisResult.overallScore,
        analyzed_at: new Date().toISOString()
      };

      const { data: updatedRows, error: updateError } = await supabase
        .from('thesis_documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('status', 'processing')
        .select('id');

      if (updateError) {
        console.warn('[ANALYZE/PROCESS] Update error:', updateError);
      }

      if (!updatedRows || updatedRows.length === 0) {
        console.warn('[ANALYZE/PROCESS] Document status changed; skipping final update.');
      }

      const processingTime = Date.now() - startTime;
      console.log(`[ANALYZE/PROCESS] Completed in ${processingTime}ms`);

      // Clean up timer
      if (timeoutTimer) clearTimeout(timeoutTimer);

      // Clean up: Delete file from storage with error handling
      try {
        const { error: deleteError } = await supabase.storage
          .from('thesis-files')
          .remove([filePath]);

        if (deleteError) {
          console.error('[ANALYZE/PROCESS] File deletion failed:', deleteError);
          // Log but don't fail the request - analysis was successful
        }
      } catch (deleteErr) {
        console.error('[ANALYZE/PROCESS] File deletion error:', deleteErr);
      }

      return NextResponse.json({
        success: true,
        documentId,
        processingTimeMs: processingTime
      });

    } catch (analysisError: any) {
      console.error('Analysis error:', analysisError);

      // Clean up timer
      if (timeoutTimer) clearTimeout(timeoutTimer);

      // Clean up file with error handling
      try {
        const { error: deleteError } = await supabase.storage
          .from('thesis-files')
          .remove([filePath]);

        if (deleteError) {
          console.error('[ANALYZE/PROCESS] File deletion failed on error:', deleteError);
        }
      } catch (deleteErr) {
        console.error('[ANALYZE/PROCESS] File deletion error on error:', deleteErr);
      }

      // Mark as failed and refund
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);

      return NextResponse.json(
        { error: 'Analysis failed: ' + analysisError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API Route Error:', error);

    // Clean up timer
    if (timeoutTimer) clearTimeout(timeoutTimer);

    return NextResponse.json(
      { error: 'An error occurred: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to mark document as failed and refund credits
async function markAsFailed(
  supabase: any,
  documentId: string,
  userId: string,
  creditsUsed: number
) {
  try {
    // Update document status
    const { error: updateError } = await supabase
      .from('thesis_documents')
      .update({ status: 'failed' })
      .eq('id', documentId)
      .eq('status', 'processing');

    if (updateError) {
      console.error('[ANALYZE/PROCESS] Failed to update document status:', updateError);
    }

    // Refund credits (skip for admin)
    const userIsAdmin = isAdmin(userId);
    if (!userIsAdmin && creditsUsed > 0) {
      const { error: refundError } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: creditsUsed,
        p_bonus: 0,
        p_payment_id: null,
        p_package_id: null
      });

      if (refundError) {
        console.error(`[CRITICAL] Credit refund failed for user ${userId}:`, refundError);
        console.error(`[CRITICAL] User may have lost ${creditsUsed} credits`);
      } else {
        console.log(`[ANALYZE/PROCESS] Refunded ${creditsUsed} credits to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('[CRITICAL] markAsFailed exception:', error);
  }
}

// Helper function to mark as failed due to timeout
async function markAsFailedWithTimeout(
  supabase: any,
  documentId: string,
  userId: string,
  creditsUsed: number
) {
  console.error(`[ANALYZE/PROCESS] TIMEOUT - Marking document ${documentId} as failed`);

  try {
    // Update document status with timeout error
    const { error: updateError } = await supabase
      .from('thesis_documents')
      .update({
        status: 'failed',
        analysis_result: {
          error: 'Analysis timeout - document too large for processing. Please try with a smaller file or contact support.'
        }
      })
      .eq('id', documentId)
      .eq('status', 'processing');

    if (updateError) {
      console.error('[ANALYZE/PROCESS] Failed to update document status on timeout:', updateError);
    }

    // Refund credits (skip for admin)
    const userIsAdmin = isAdmin(userId);
    if (!userIsAdmin && creditsUsed > 0) {
      const { error: refundError } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: creditsUsed,
        p_bonus: 0,
        p_payment_id: null,
        p_package_id: null
      });

      if (refundError) {
        console.error(`[CRITICAL] Timeout credit refund failed for user ${userId}:`, refundError);
        console.error(`[CRITICAL] User may have lost ${creditsUsed} credits`);
      } else {
        console.log(`[ANALYZE/PROCESS] TIMEOUT REFUND - ${creditsUsed} credits to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('[CRITICAL] markAsFailedWithTimeout exception:', error);
  }
}
