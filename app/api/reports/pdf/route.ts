// app/api/reports/pdf/route.ts
// ============================================================================
// Analiz raporunu profesyonel, VEKTÖREL PDF olarak üretir (@react-pdf/renderer).
// Server-side renderToBuffer → application/pdf attachment. Ücretsiz (pricing.ts
// pdf_report = 0). IDOR guard: yalnız kullanıcının kendi analiz edilmiş dokümanı.
// ============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AnalysisReportPDF } from '@/app/components/pdf/AnalysisReportPDF';

// @react-pdf fontkit/zlib gibi Node API'leri kullanır → Node runtime şart (Edge değil).
export const runtime = 'nodejs';
export const maxDuration = 30; // font fetch + render için güvenli pay

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Auth (getUser server-side doğrular)
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId } = body;
    if (!documentId) {
      return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 });
    }

    // IDOR guard: yalnız kullanıcının kendi dokümanı (user_id eşleşmesi)
    const { data: document, error: docError } = await supabaseAdmin
      .from('thesis_documents')
      .select('id, user_id, filename, status, analysis_result')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Döküman bulunamadı' }, { status: 404 });
    }
    if (document.status !== 'analyzed' || !document.analysis_result) {
      return NextResponse.json({ error: 'Döküman henüz analiz edilmedi' }, { status: 400 });
    }

    // PDF üret (ücretsiz — kredi düşürülmez)
    const element = React.createElement(AnalysisReportPDF, {
      result: document.analysis_result,
      filename: document.filename,
    });
    const buffer = await renderToBuffer(element as any);

    // Content-Disposition için ASCII-güvenli dosya adı (Türkçe karakterler → _)
    const safeName =
      (document.filename || 'rapor')
        .replace(/\.(pdf|docx)$/i, '')
        .replace(/[^\w.-]+/g, '_')
        .slice(0, 60) || 'rapor';

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TezAI-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PDF Report] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF oluşturulamadı' },
      { status: 500 }
    );
  }
}
