// app/api/analyze/premium/route.ts
// ============================================================================
// Premium Tez Analizi Endpoint
// - Gemini 1.5 Pro ile tam tez analizi
// - Sayfa bazlı spesifik öneriler
// - YÖK standartları kontrolü
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { extractPdfText } from '@/app/lib/fileUtils';
import { isAdmin } from '@/app/lib/adminUtils';
import { analyzePremium } from '@/app/lib/thesis/premiumAnalysisService';

// 5 dakika timeout (Vercel Pro)
export const maxDuration = 300;

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tier ve kredi belirleme
function getTierAndCredits(pageCount: number): { tier: 'basic' | 'standard' | 'comprehensive'; credits: number } {
  if (pageCount < 50) return { tier: 'basic', credits: 10 };
  if (pageCount < 150) return { tier: 'standard', credits: 25 };
  return { tier: 'comprehensive', credits: 50 };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth kontrolü
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const userId = session.user.id;
    const userIsAdmin = isAdmin(userId);

    // Request body
    const body = await request.json();
    const { filePath, fileName } = body;

    if (!filePath || !fileName) {
      return NextResponse.json({ error: 'filePath ve fileName gerekli' }, { status: 400 });
    }

    console.log(`[PREMIUM] Starting analysis for: ${fileName}`);

    // Dosyayı indir
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('thesis-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('[PREMIUM] File download error:', downloadError);
      return NextResponse.json({ error: 'Dosya indirilemedi' }, { status: 404 });
    }

    // Buffer'a çevir ve metin çıkar
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text = '';

    if (fileName.toLowerCase().endsWith('.pdf')) {
      text = await extractPdfText(buffer);
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: 'Desteklenmeyen dosya formatı. PDF veya DOCX yükleyin.' }, { status: 400 });
    }

    if (!text || text.length < 1000) {
      return NextResponse.json({ error: 'Dosyadan yeterli metin çıkarılamadı. Lütfen metin içeren bir tez yükleyin.' }, { status: 400 });
    }

    // İstatistikler
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.ceil(text.length / 2750);
    const { tier, credits } = getTierAndCredits(pageCount);

    console.log(`[PREMIUM] Document stats: ${pageCount} pages, ${wordCount} words, tier: ${tier}`);

    // Kredi kontrolü (admin değilse)
    if (!userIsAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < credits) {
        return NextResponse.json({
          error: 'Yetersiz kredi',
          details: {
            required: credits,
            current: profile?.credits || 0,
            tier,
            pageCount
          }
        }, { status: 402 });
      }

      // Kredi düş
      await supabaseAdmin.rpc('use_credits', {
        p_user_id: userId,
        p_amount: credits,
        p_action_type: `thesis_${tier}`,
        p_description: `Premium tez analizi: ${fileName}`
      });
    }

    // Döküman kaydı oluştur
    const { data: document, error: insertError } = await supabaseAdmin
      .from('thesis_documents')
      .insert({
        user_id: userId,
        filename: fileName,
        file_size: buffer.length,
        file_type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
        page_count: pageCount,
        word_count: wordCount,
        status: 'processing',
        analysis_type: tier,
        credits_used: userIsAdmin ? 0 : credits,
      })
      .select()
      .single();

    if (insertError || !document) {
      console.error('[PREMIUM] Document insert error:', insertError);
      // Kredi iadesi
      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null
        });
      }
      return NextResponse.json({ error: 'Döküman kaydedilemedi' }, { status: 500 });
    }

    try {
      // ============================================
      // PREMIUM ANALİZ (Gemini Pro)
      // ============================================

      console.log(`[PREMIUM] Starting Gemini Pro analysis...`);

      // Metin limitini kontrol et - Gemini Pro 1M token işleyebilir
      // Ama güvenlik için 500K karakter ile sınırla (~180 sayfa)
      const maxChars = 500000;
      const analysisText = text.length > maxChars
        ? text.substring(0, maxChars) + '\n\n[...Tezin geri kalanı boyut sınırı nedeniyle kesildi...]'
        : text;

      if (text.length > maxChars) {
        console.log(`[PREMIUM] Text truncated: ${text.length} -> ${maxChars} chars`);
      }

      // Premium analiz yap
      const analysisResult = await analyzePremium(analysisText, {
        fileName,
        includeImages: false, // Şimdilik görsel analizi kapalı
      });

      // Veritabanını güncelle
      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'analyzed',
          analysis_result: analysisResult,
          overall_score: analysisResult.overallScore,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      // Dosyayı sil (temizlik)
      try {
        await supabaseAdmin.storage.from('thesis-uploads').remove([filePath]);
      } catch (deleteError) {
        console.warn('[PREMIUM] File deletion failed:', deleteError);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[PREMIUM] Analysis completed in ${processingTime}ms`);

      return NextResponse.json({
        success: true,
        documentId: document.id,
        result: analysisResult,
        processingTimeMs: processingTime,
      });

    } catch (analysisError: any) {
      console.error('[PREMIUM] Analysis error:', analysisError);

      // Kredi iadesi
      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null
        });
        console.log(`[PREMIUM] Refunded ${credits} credits to user`);
      }

      // Dökümanı failed olarak işaretle
      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          analysis_result: { error: analysisError.message }
        })
        .eq('id', document.id);

      return NextResponse.json(
        { error: 'Analiz sırasında bir hata oluştu: ' + analysisError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[PREMIUM] Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
