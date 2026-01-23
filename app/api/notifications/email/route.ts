import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendAnalysisCompletedEmail,
  sendAnalysisFailedEmail,
} from '@/app/lib/email';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Internal API key doğrulama (QStash veya internal servisler için)
function verifyInternalKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === process.env.INTERNAL_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    // Internal API key kontrolü
    if (!verifyInternalKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, documentId, userId, errorMessage, creditsRefunded } = body;

    // Kullanıcı bilgilerini al
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, username, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const userName = profile.full_name || profile.username || 'Kullanıcı';

    switch (type) {
      case 'analysis_completed': {
        // Döküman bilgilerini al
        const { data: document, error: docError } = await supabaseAdmin
          .from('thesis_documents')
          .select('filename, overall_score, analysis_result')
          .eq('id', documentId)
          .single();

        if (docError || !document) {
          return NextResponse.json({ error: 'Döküman bulunamadı' }, { status: 404 });
        }

        const result = document.analysis_result;

        await sendAnalysisCompletedEmail({
          to: profile.email,
          userName,
          documentName: document.filename,
          overallScore: document.overall_score,
          gradeLetter: result?.grade?.letter || 'N/A',
          gradeLabel: result?.grade?.label || 'Değerlendirilmedi',
          documentId,
        });

        return NextResponse.json({ success: true, type: 'analysis_completed' });
      }

      case 'analysis_failed': {
        // Döküman bilgilerini al
        const { data: document } = await supabaseAdmin
          .from('thesis_documents')
          .select('filename')
          .eq('id', documentId)
          .single();

        await sendAnalysisFailedEmail({
          to: profile.email,
          userName,
          documentName: document?.filename || 'Bilinmeyen dosya',
          errorMessage: errorMessage || 'Bilinmeyen hata',
          creditsRefunded: creditsRefunded || 0,
        });

        return NextResponse.json({ success: true, type: 'analysis_failed' });
      }

      default:
        return NextResponse.json(
          { error: `Bilinmeyen bildirim tipi: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Email Notification] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email gönderilemedi' },
      { status: 500 }
    );
  }
}
