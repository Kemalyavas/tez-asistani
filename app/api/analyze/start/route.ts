// app/api/analyze/start/route.ts
// ============================================================================
// Start Analysis - Creates document record and deducts credits
// Returns immediately with document ID for polling
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../../lib/rateLimit';
import { extractPdfText } from '../../../lib/fileUtils';
import { CREDIT_COSTS, getAnalysisTier } from '../../../lib/pricing';
import { isAdmin } from '../../../lib/adminUtils';

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
  try {
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = rateLimit(`analyze_${clientIP}`, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 10,
      blockDurationMs: 30 * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
      const waitTime = rateLimitResult.blockedUntil
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000 / 60)
        : Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        { error: `Too many requests. Please try again in ${waitTime} minutes.` },
        { status: 429 }
      );
    }

    // Authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to analyze your thesis' },
        { status: 401 }
      );
    }

    // Get file path from request body
    const body = await request.json();
    const { filePath, fileName } = body;

    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('thesis-files')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      return NextResponse.json(
        { error: 'Could not download file from storage' },
        { status: 500 }
      );
    }

    // Validate file type by extension
    const isDocx = fileName.endsWith('.docx');
    const isPdf = fileName.endsWith('.pdf');

    if (!isDocx && !isPdf) {
      return NextResponse.json(
        { error: 'Please upload a PDF or DOCX file' },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const bytes = await fileData.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY: Validate file content (magic bytes) to prevent malicious uploads
    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    // DOCX magic bytes: PK (0x50 0x4B) - it's a ZIP file
    const magicBytes = buffer.slice(0, 4);
    const isPdfMagic = magicBytes[0] === 0x25 && magicBytes[1] === 0x50 &&
                       magicBytes[2] === 0x44 && magicBytes[3] === 0x46; // %PDF
    const isZipMagic = magicBytes[0] === 0x50 && magicBytes[1] === 0x4B; // PK (ZIP/DOCX)

    if (isPdf && !isPdfMagic) {
      console.error('[ANALYZE/START] Invalid PDF magic bytes:', magicBytes.toString('hex'));
      return NextResponse.json(
        { error: 'Invalid PDF file. The file content does not match PDF format.' },
        { status: 400 }
      );
    }

    if (isDocx && !isZipMagic) {
      console.error('[ANALYZE/START] Invalid DOCX magic bytes:', magicBytes.toString('hex'));
      return NextResponse.json(
        { error: 'Invalid DOCX file. The file content does not match DOCX format.' },
        { status: 400 }
      );
    }

    // Additional size validation (server-side)
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 15MB. Your file: ${(buffer.length / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }
    let text = '';

    if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (isPdf) {
      try {
        text = await extractPdfText(buffer);
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        return NextResponse.json(
          { error: 'Could not read PDF file. Please try a different file or convert to DOCX.' },
          { status: 400 }
        );
      }
    }

    if (!text || text.length < 1000) {
      return NextResponse.json(
        { error: 'Document is too short or could not be read. Minimum 1000 characters required.' },
        { status: 400 }
      );
    }

    // Estimate document size
    const pageCount = estimatePageCount(text);
    const wordCount = getWordCount(text);

    console.log(`[ANALYZE/START] File: ${fileName}, Pages: ~${pageCount}, Words: ${wordCount}`);

    // Determine analysis tier and credit cost
    const analysisTier = getAnalysisTier(pageCount);
    const actionType = `thesis_${analysisTier.id}` as keyof typeof CREDIT_COSTS;
    const creditsRequired = CREDIT_COSTS[actionType]?.creditsRequired || 10;

    console.log(`[ANALYZE/START] Tier: ${analysisTier.id}, Credits: ${creditsRequired}`);

    // Admin bypass - skip credit deduction
    const userIsAdmin = isAdmin(user.id);
    let creditInfo: any = null;

    if (userIsAdmin) {
      console.log('[ADMIN] Credit check bypassed for user:', user.id);
      creditInfo = { success: true, new_balance: 999999 };
    } else {
      // Deduct credits for non-admin users
      const { data: creditResult, error: creditError } = await supabase.rpc('use_credits', {
        p_user_id: user.id,
        p_amount: creditsRequired,
        p_action_type: actionType,
        p_description: `Thesis analysis: ${fileName} (~${pageCount} pages)`
      });

      if (creditError) {
        console.error('Credit deduction error:', creditError);
        return NextResponse.json(
          { error: 'Failed to process credits. Please try again.' },
          { status: 500 }
        );
      }

      creditInfo = creditResult?.[0];
      if (!creditInfo?.success) {
        return NextResponse.json(
          {
            error: creditInfo?.error_message || 'Insufficient credits',
            creditsRequired,
            currentCredits: creditInfo?.new_balance || 0,
            analysisTier: analysisTier.name
          },
          { status: 402 }
        );
      }
    }

    // Create thesis document record with 'processing' status
    const { data: thesisDoc, error: docError } = await supabase
      .from('thesis_documents')
      .insert({
        user_id: user.id,
        filename: fileName,
        file_size: fileData.size,
        file_type: isPdf ? 'pdf' : 'docx',
        page_count: pageCount,
        word_count: wordCount,
        status: 'processing',
        analysis_type: analysisTier.id,
        credits_used: creditsRequired
      })
      .select('id')
      .single();

    if (docError || !thesisDoc) {
      console.error('Document creation error:', docError);

      // Refund credits if document creation failed
      if (!userIsAdmin) {
        try {
          const { error: refundError } = await supabase.rpc('add_credits', {
            p_user_id: user.id,
            p_amount: creditsRequired,
            p_bonus: 0,
            p_payment_id: null,
            p_package_id: null
          });

          if (refundError) {
            // KRİTİK: Kredi iadesi başarısız - loglayıp admin'e bildir
            console.error('[CRITICAL] Credit refund failed:', refundError);
            console.error(`[CRITICAL] User ${user.id} lost ${creditsRequired} credits due to refund failure`);
            // TODO: Admin bildirim sistemi ekle (email, Slack, etc.)
          } else {
            console.log(`[ANALYZE/START] Credits refunded to user ${user.id}: ${creditsRequired}`);
          }
        } catch (refundException) {
          console.error('[CRITICAL] Credit refund exception:', refundException);
          console.error(`[CRITICAL] User ${user.id} may have lost ${creditsRequired} credits`);
        }
      }

      return NextResponse.json(
        { error: 'Failed to create document record. If credits were deducted, they will be refunded.' },
        { status: 500 }
      );
    }

    console.log(`[ANALYZE/START] Document created: ${thesisDoc.id}`);

    // Return immediately with document ID
    // The actual analysis will be triggered by /api/analyze/process
    return NextResponse.json({
      success: true,
      documentId: thesisDoc.id,
      pageCount,
      wordCount,
      analysisTier: analysisTier.id,
      creditsUsed: creditsRequired,
      remainingCredits: creditInfo.new_balance
    });

  } catch (error: any) {
    console.error('API Route Error:', error);

    return NextResponse.json(
      { error: 'An error occurred: ' + error.message },
      { status: 500 }
    );
  }
}
