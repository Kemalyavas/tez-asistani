import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { enqueueAnalysis, AnalysisTier } from '@/app/lib/queue/qstash';
import { apiRateLimiter, analysisRateLimiter } from '@/app/lib/queue/qstash';
import { isAdmin } from '@/app/lib/adminUtils';
import { v4 as uuidv4 } from 'uuid';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Analiz tier'larına göre kredi maliyetleri
const TIER_CREDITS: Record<AnalysisTier, number> = {
  basic: 10,
  standard: 25,
  comprehensive: 50,
};

// Sayfa sayısına göre tier belirle
function determineTier(pageCount: number): AnalysisTier {
  if (pageCount < 50) return 'basic';
  if (pageCount < 150) return 'standard';
  return 'comprehensive';
}

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const userId = session.user.id;
    const userIsAdmin = isAdmin(userId);

    // Rate limiting (admin hariç)
    if (!userIsAdmin) {
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

      // API rate limit
      const apiLimit = await apiRateLimiter.limit(clientIP);
      if (!apiLimit.success) {
        return NextResponse.json(
          { error: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.' },
          { status: 429 }
        );
      }

      // Analysis rate limit
      const analysisLimit = await analysisRateLimiter.limit(userId);
      if (!analysisLimit.success) {
        return NextResponse.json(
          {
            error: 'Analiz limitinize ulaştınız. 15 dakika içinde maksimum 5 analiz yapabilirsiniz.',
            remaining: analysisLimit.remaining,
            reset: analysisLimit.reset,
          },
          { status: 429 }
        );
      }
    }

    // Request body
    const body = await request.json();
    const { filePath, fileName, forceTier } = body;

    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'filePath ve fileName gerekli' },
        { status: 400 }
      );
    }

    // Dosya bilgilerini al
    const { data: fileInfo, error: fileError } = await supabaseAdmin.storage
      .from('thesis-uploads')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop(),
      });

    if (fileError || !fileInfo || fileInfo.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 });
    }

    const file = fileInfo[0];
    const fileSize = file.metadata?.size || 0;

    // Dosya boyutuna göre tahmini sayfa sayısı (ortalama 2750 karakter/sayfa)
    // Not: Gerçek sayfa sayısı metin çıkarıldıktan sonra hesaplanacak
    const estimatedPages = Math.ceil(fileSize / 5000); // Yaklaşık tahmin

    // Tier belirle
    const tier: AnalysisTier = forceTier || determineTier(estimatedPages);
    const creditsRequired = TIER_CREDITS[tier];

    // Kredi kontrolü (admin hariç)
    if (!userIsAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditsRequired) {
        return NextResponse.json(
          {
            error: 'Yetersiz kredi',
            required: creditsRequired,
            current: profile?.credits || 0,
          },
          { status: 402 }
        );
      }

      // Kredi düş
      const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('use_credits', {
        p_user_id: userId,
        p_amount: creditsRequired,
        p_action_type: `thesis_${tier}`,
        p_description: `Tez analizi: ${fileName}`,
      });

      if (creditError || !creditResult?.[0]?.success) {
        return NextResponse.json(
          { error: creditResult?.[0]?.error_message || 'Kredi düşülemedi' },
          { status: 400 }
        );
      }
    }

    // Döküman kaydı oluştur
    const documentId = uuidv4();

    const { error: insertError } = await supabaseAdmin.from('thesis_documents').insert({
      id: documentId,
      user_id: userId,
      filename: fileName,
      file_size: fileSize,
      file_type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
      status: 'uploaded',
      analysis_type: tier,
      credits_used: userIsAdmin ? 0 : creditsRequired,
      processing_status: {
        step: 0,
        totalSteps: tier === 'comprehensive' ? 5 : tier === 'standard' ? 4 : 3,
        stepName: 'Başlatılıyor',
        progress: 0,
        status: 'pending',
      },
    });

    if (insertError) {
      // Kredi iadesi yap
      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: creditsRequired,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null,
        });
      }

      return NextResponse.json(
        { error: 'Döküman kaydedilemedi: ' + insertError.message },
        { status: 500 }
      );
    }

    // QStash pipeline'ı başlat
    try {
      const { messageId } = await enqueueAnalysis({
        documentId,
        userId,
        filePath,
        fileName,
        analysisTier: tier,
      });

      console.log(`[AnalyzeV2] Analysis queued: ${documentId}, messageId: ${messageId}`);

      return NextResponse.json({
        success: true,
        documentId,
        messageId,
        tier,
        creditsUsed: userIsAdmin ? 0 : creditsRequired,
        estimatedPages,
        message: 'Analiz başlatıldı. Sonuçlar hazır olduğunda bilgilendirileceksiniz.',
      });
    } catch (queueError) {
      // Queue hatası - kredi iadesi ve döküman silme
      console.error('[AnalyzeV2] Queue error:', queueError);

      await supabaseAdmin.from('thesis_documents').delete().eq('id', documentId);

      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: creditsRequired,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null,
        });
      }

      return NextResponse.json(
        { error: 'Analiz kuyruğa eklenemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[AnalyzeV2] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Analiz durumunu kontrol et
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 });
    }

    // Auth kontrolü
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    // Dökümanı al
    const { data: document, error } = await supabaseAdmin
      .from('thesis_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Döküman bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      documentId: document.id,
      status: document.status,
      processingStatus: document.processing_status,
      analysisResult: document.analysis_result,
      overallScore: document.overall_score,
      analyzedAt: document.analyzed_at,
    });
  } catch (error) {
    console.error('[AnalyzeV2 GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
