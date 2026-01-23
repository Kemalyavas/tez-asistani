import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getJobStatus } from '@/app/lib/queue/qstash';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    // Veritabanından da kontrol et
    const { data: document, error } = await supabaseAdmin
      .from('thesis_documents')
      .select('id, status, processing_status, overall_score, analyzed_at')
      .eq('id', documentId)
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
