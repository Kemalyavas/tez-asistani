// app/api/analyze/process/route.ts
// ============================================================================
// Process Analysis - Does the actual AI analysis in background
// Updates thesis_documents record when complete
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extractPdfText } from '../../../lib/fileUtils';
import { isAdmin } from '../../../lib/adminUtils';
import {
  chunkThesisText,
  getChunkEmbeddings,
} from '../../../lib/thesis/chunkingService';
import {
  analyzeThesis,
  quickAnalysis,
  AnalysisResult
} from '../../../lib/thesis/analysisService';

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

  try {
    // Authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get parameters
    const body = await request.json();
    const { documentId, filePath, fileName } = body;

    if (!documentId || !filePath || !fileName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (doc.status !== 'processing') {
      // Already processed or failed
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        status: doc.status
      });
    }

    console.log(`[ANALYZE/PROCESS] Starting analysis for document: ${documentId}`);

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

    // Extract text
    const isDocx = fileName.endsWith('.docx');
    const isPdf = fileName.endsWith('.pdf');
    const bytes = await fileData.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = '';

    try {
      if (isDocx) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (isPdf) {
        text = await extractPdfText(buffer);
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Could not parse document' },
        { status: 500 }
      );
    }

    if (!text || text.length < 1000) {
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);
      return NextResponse.json(
        { error: 'Document too short' },
        { status: 400 }
      );
    }

    const pageCount = estimatePageCount(text);
    const wordCount = getWordCount(text);
    const analysisTier = doc.analysis_type;

    console.log(`[ANALYZE/PROCESS] Pages: ${pageCount}, Words: ${wordCount}, Tier: ${analysisTier}`);

    // Perform analysis
    let analysisResult: AnalysisResult;

    try {
      if (analysisTier === 'basic') {
        // Basic: Quick single-pass analysis
        analysisResult = await quickAnalysis(text, pageCount);

      } else {
        // Standard/Comprehensive: Full RAG-based analysis

        // 1. Chunk the text
        const chunks = chunkThesisText(text, {
          maxTokensPerChunk: analysisTier === 'comprehensive' ? 2000 : 1500,
          overlapTokens: 150,
          preserveSections: true
        });

        console.log(`[ANALYZE/PROCESS] Created ${chunks.length} chunks`);

        // 2. Store chunks in database
        const chunkInserts = chunks.map(chunk => ({
          thesis_id: documentId,
          user_id: user.id,
          chunk_index: chunk.index,
          content: chunk.content,
          token_count: chunk.tokenCount,
          section_type: chunk.sectionType,
          metadata: chunk.metadata
        }));

        // Insert chunks in batches
        const batchSize = 50;
        for (let i = 0; i < chunkInserts.length; i += batchSize) {
          const batch = chunkInserts.slice(i, i + batchSize);
          await supabase.from('thesis_chunks').insert(batch);
        }

        // 3. Generate embeddings for comprehensive analysis
        if (analysisTier === 'comprehensive' && chunks.length > 0) {
          try {
            const embeddings = await getChunkEmbeddings(chunks.slice(0, 50));

            for (const [index, embedding] of embeddings) {
              await supabase
                .from('thesis_chunks')
                .update({ embedding: embedding })
                .eq('thesis_id', documentId)
                .eq('chunk_index', index);
            }
          } catch (embeddingError) {
            console.warn('Embedding generation failed, continuing without:', embeddingError);
          }
        }

        // 4. Run multi-pass analysis
        analysisResult = await analyzeThesis(chunks, analysisTier as 'standard' | 'comprehensive');
      }

      // Update thesis document with results
      const updateData = {
        status: 'analyzed',
        analysis_result: {
          overall_score: analysisResult.overallScore,
          overallScore: analysisResult.overallScore,
          grade_category: analysisResult.gradeCategory,
          gradeCategory: analysisResult.gradeCategory,
          summary: analysisResult.summary,
          category_scores: {
            structure: analysisResult.categoryScores.structure,
            methodology: analysisResult.categoryScores.methodology,
            writing_quality: analysisResult.categoryScores.writingQuality,
            references: analysisResult.categoryScores.references
          },
          categoryScores: analysisResult.categoryScores,
          critical_issues: analysisResult.criticalIssues,
          criticalIssues: analysisResult.criticalIssues,
          major_issues: analysisResult.majorIssues,
          majorIssues: analysisResult.majorIssues,
          minor_issues: analysisResult.minorIssues,
          minorIssues: analysisResult.minorIssues,
          strengths: analysisResult.strengths,
          immediate_actions: analysisResult.immediateActions,
          immediateActions: analysisResult.immediateActions,
          recommendations: analysisResult.recommendations,
          metadata: analysisResult.metadata
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

      // Clean up: Delete file from storage
      await supabase.storage
        .from('thesis-files')
        .remove([filePath]);

      return NextResponse.json({
        success: true,
        documentId,
        processingTimeMs: processingTime
      });

    } catch (analysisError: any) {
      console.error('Analysis error:', analysisError);

      // Clean up file
      await supabase.storage
        .from('thesis-files')
        .remove([filePath]);

      // Mark as failed and refund
      await markAsFailed(supabase, documentId, user.id, doc.credits_used);

      return NextResponse.json(
        { error: 'Analysis failed: ' + analysisError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API Route Error:', error);

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
  // Update document status
  await supabase
    .from('thesis_documents')
    .update({ status: 'failed' })
    .eq('id', documentId)
    .eq('status', 'processing');

  // Refund credits (skip for admin)
  const userIsAdmin = isAdmin(userId);
  if (!userIsAdmin && creditsUsed > 0) {
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: creditsUsed,
      p_bonus: 0,
      p_payment_id: null,
      p_package_id: null
    });
    console.log(`[ANALYZE/PROCESS] Refunded ${creditsUsed} credits to user ${userId}`);
  }
}
