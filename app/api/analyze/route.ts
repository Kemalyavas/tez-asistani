// app/api/analyze/route.ts
// ============================================================================
// Thesis Analysis API Route - Credit-Based with RAG Support
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../lib/rateLimit';
import { extractPdfText } from '../../lib/fileUtils';
import { CREDIT_COSTS, getAnalysisTier } from '../../lib/pricing';
import { isAdmin } from '../../lib/adminUtils';
import {
  chunkThesisText,
  getChunkEmbeddings,
  ThesisChunk
} from '../../lib/thesis/chunkingService';
import {
  analyzeThesis,
  quickAnalysis,
  AnalysisResult
} from '../../lib/thesis/analysisService';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate page count from text length
 */
function estimatePageCount(text: string): number {
  // Average thesis page: ~2500-3000 characters (including spaces)
  const charsPerPage = 2750;
  return Math.ceil(text.length / charsPerPage);
}

/**
 * Get word count
 */
function getWordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = rateLimit(`analyze_${clientIP}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5, // 5 analyses per 15 minutes
      blockDurationMs: 30 * 60 * 1000 // 30 minutes block
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

    // Validate file type
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

    console.log(`[ANALYZE] File: ${fileName}, Pages: ~${pageCount}, Words: ${wordCount}`);

    // Determine analysis tier and credit cost
    const analysisTier = getAnalysisTier(pageCount);
    const actionType = `thesis_${analysisTier.id}` as keyof typeof CREDIT_COSTS;
    const creditsRequired = CREDIT_COSTS[actionType]?.creditsRequired || 10;

    console.log(`[ANALYZE] Tier: ${analysisTier.id}, Credits: ${creditsRequired}`);

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

    // Create thesis document record
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

    const thesisId = thesisDoc?.id;

    // Perform analysis based on tier
    let analysisResult: AnalysisResult;

    try {
      if (analysisTier.id === 'basic') {
        // Basic: Quick single-pass analysis
        analysisResult = await quickAnalysis(text, pageCount);
        
      } else {
        // Standard/Comprehensive: Full RAG-based analysis
        
        // 1. Chunk the text
        const chunks = chunkThesisText(text, {
          maxTokensPerChunk: analysisTier.id === 'comprehensive' ? 2000 : 1500,
          overlapTokens: 150,
          preserveSections: true
        });

        console.log(`[ANALYZE] Created ${chunks.length} chunks`);

        // 2. Store chunks in database (for potential future queries)
        if (thesisId) {
          const chunkInserts = chunks.map(chunk => ({
            thesis_id: thesisId,
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
        }

        // 3. Generate embeddings for comprehensive analysis
        if (analysisTier.id === 'comprehensive' && chunks.length > 0) {
          try {
            const embeddings = await getChunkEmbeddings(chunks.slice(0, 50)); // Limit for cost
            
            // Update chunks with embeddings
            // Note: Supabase/pgvector accepts embedding array directly, not JSON string
            for (const [index, embedding] of embeddings) {
              if (thesisId) {
                await supabase
                  .from('thesis_chunks')
                  .update({ embedding: embedding })
                  .eq('thesis_id', thesisId)
                  .eq('chunk_index', index);
              }
            }
          } catch (embeddingError) {
            console.warn('Embedding generation failed, continuing without:', embeddingError);
          }
        }

        // 4. Run multi-pass analysis
        analysisResult = await analyzeThesis(chunks, analysisTier.id as 'standard' | 'comprehensive');
      }

      // Update thesis document with results
      if (thesisId) {
        await supabase
          .from('thesis_documents')
          .update({
            status: 'analyzed',
            analysis_result: analysisResult,
            overall_score: analysisResult.overallScore,
            analyzed_at: new Date().toISOString()
          })
          .eq('id', thesisId);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[ANALYZE] Completed in ${processingTime}ms`);

      // Clean up: Delete file from storage after successful analysis
      await supabase.storage
        .from('thesis-files')
        .remove([filePath]);

      // Return result
      return NextResponse.json({
        success: true,
        
        // Main results
        overall_score: analysisResult.overallScore,
        grade_category: analysisResult.gradeCategory,
        summary: analysisResult.summary,
        
        // Category scores
        category_scores: {
          structure: {
            score: analysisResult.categoryScores.structure.score,
            feedback: analysisResult.categoryScores.structure.feedback
          },
          methodology: {
            score: analysisResult.categoryScores.methodology.score,
            feedback: analysisResult.categoryScores.methodology.feedback
          },
          writing_quality: {
            score: analysisResult.categoryScores.writingQuality.score,
            feedback: analysisResult.categoryScores.writingQuality.feedback
          },
          references: {
            score: analysisResult.categoryScores.references.score,
            feedback: analysisResult.categoryScores.references.feedback
          }
        },
        
        // Issues
        critical_issues: analysisResult.criticalIssues.map(i => ({
          title: i.title,
          description: i.description,
          impact: i.impact,
          solution: i.solution,
          example: i.example || ''
        })),
        
        major_issues: analysisResult.majorIssues.map(i => ({
          title: i.title,
          description: i.description,
          impact: i.impact,
          solution: i.solution,
          example: i.example || ''
        })),
        
        minor_issues: analysisResult.minorIssues.map(i => ({
          title: i.title,
          description: i.description,
          impact: i.impact,
          solution: i.solution,
          example: i.example || ''
        })),
        
        // Positives and recommendations
        strengths: analysisResult.strengths,
        immediate_actions: analysisResult.immediateActions,
        recommendations: analysisResult.recommendations,
        
        // Metadata
        metadata: {
          thesis_id: thesisId,
          analysis_type: analysisTier.id,
          page_count: pageCount,
          word_count: wordCount,
          sections_found: analysisResult.metadata.sectionsFound,
          missing_sections: analysisResult.metadata.missingEssentialSections,
          processing_time_ms: processingTime
        },
        
        // Credit info
        credits_used: creditsRequired,
        remaining_credits: creditInfo.new_balance
      });

    } catch (analysisError: any) {
      console.error('Analysis error:', analysisError);

      // Clean up: Delete file from storage
      await supabase.storage
        .from('thesis-files')
        .remove([filePath]);

      // Update document status to failed
      if (thesisId) {
        await supabase
          .from('thesis_documents')
          .update({ status: 'failed' })
          .eq('id', thesisId);
      }

      // Refund credits on analysis failure (skip for admin)
      if (!userIsAdmin) {
        await supabase.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: creditsRequired,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null
        });
      }

      return NextResponse.json(
        {
          error: 'Analysis failed. Your credits have been refunded.',
          details: analysisError.message
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API Route Error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during analysis: ' + error.message },
      { status: 500 }
    );
  }
}
