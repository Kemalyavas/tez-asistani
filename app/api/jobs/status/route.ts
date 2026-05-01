import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getJobStatus } from '@/app/lib/queue/qstash';

// Supabase admin client (RLS bypass için; ownership kontrolü manuel yapılıyor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü (getUser server-side doğrulama yapar)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId parametresi gerekli' },
        { status: 400 }
      );
    }

    // Önce Redis'ten durumu kontrol et
    const redisStatus = await getJobStatus(documentId);

    // Veritabanından kontrol et + ownership zorunlu
    const { data: document, error } = await supabaseAdmin
      .from('thesis_documents')
      .select('id, status, processing_status, overall_score, analyzed_at')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı' },
        { status: 404 }
      );
    }

    // Durumu birleştir
    const status = {
      documentId,
      status: document.status,
      processing: document.processing_status || redisStatus,
      isCompleted: document.status === 'analyzed',
      isFailed: document.status === 'failed',
      overallScore: document.overall_score,
      analyzedAt: document.analyzed_at,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Status] Error:', error);
    return NextResponse.json(
      { error: 'Durum sorgulanamadı' },
      { status: 500 }
    );
  }
}
