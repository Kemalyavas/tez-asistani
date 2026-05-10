// app/api/rubric/feedback/route.ts
// ============================================================================
// User feedback for rubric findings
// ============================================================================
//
// Kullanıcı bir rubric bulgusunda "yanlış / eksik / yorum hatalı" işaretlerse
// bunu rubric_feedback tablosuna yazar. Aynı (user, document, rubric_item)
// üçlüsü için tek satır tutulur — re-submit upsert eder.
//
// Üretilen veri:
//   - Audit: hangi rubric item'ları AI tutarsız tespit ediyor (calibration query)
//   - Reflect-and-revise: rubric item description'larını iyileştirmek için ham
//     veri (literatür: 200 örnekle +0.47 QWK iyileşme)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../../lib/rateLimit';
import { getRubricItemById } from '../../../lib/thesis/rubric';

// Sadece bu 4 tip kabul ediyoruz; DB'de CHECK constraint var ama erken validate.
const FEEDBACK_TYPES = ['false_positive', 'incomplete', 'wrong_comment', 'other'] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

const MAX_NOTE_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    // Rate limit — feedback gönderimi için cömert sınır.
    // Aynı kullanıcının test sırasında engellenmesi istenmiyor.
    const clientIP = getClientIP(request, request.headers);
    const rl = await rateLimit(`rubric_feedback_${clientIP}`, {
      windowMs: 60 * 1000,
      maxAttempts: 30,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla geri bildirim. Bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    // Auth
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    // Body parse + validation
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
    }

    const { documentId, rubricItemId, feedbackType, note } = body as {
      documentId?: unknown;
      rubricItemId?: unknown;
      feedbackType?: unknown;
      note?: unknown;
    };

    if (typeof documentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(documentId)) {
      return NextResponse.json({ error: 'documentId geçersiz' }, { status: 400 });
    }

    if (typeof rubricItemId !== 'string' || !getRubricItemById(rubricItemId)) {
      return NextResponse.json(
        { error: 'rubricItemId rubric tanımında yok' },
        { status: 400 }
      );
    }

    if (typeof feedbackType !== 'string' || !FEEDBACK_TYPES.includes(feedbackType as FeedbackType)) {
      return NextResponse.json(
        { error: `feedbackType ${FEEDBACK_TYPES.join('/')} olmalı` },
        { status: 400 }
      );
    }

    let safeNote: string | null = null;
    if (note !== undefined && note !== null) {
      if (typeof note !== 'string') {
        return NextResponse.json({ error: 'note string olmalı' }, { status: 400 });
      }
      if (note.length > MAX_NOTE_LENGTH) {
        return NextResponse.json(
          { error: `note ${MAX_NOTE_LENGTH} karakteri aşamaz` },
          { status: 400 }
        );
      }
      safeNote = note.trim() || null;
    }

    // Document ownership + rubric_version'u çek
    const { data: doc, error: docErr } = await supabase
      .from('thesis_documents')
      .select('id, user_id, rubric_version')
      .eq('id', documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: 'Döküman bulunamadı' }, { status: 404 });
    }
    if (doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Bu döküman size ait değil' }, { status: 403 });
    }

    // Upsert — aynı (user, document, item) için tek kayıt; yeni gönderim
    // mevcudu günceller. UNIQUE constraint DB'de var, on conflict do update.
    const { error: upsertErr } = await supabase
      .from('rubric_feedback')
      .upsert(
        {
          user_id: user.id,
          document_id: documentId,
          rubric_item_id: rubricItemId,
          rubric_version: doc.rubric_version || 'unknown',
          feedback_type: feedbackType as FeedbackType,
          note: safeNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_id,rubric_item_id' }
      );

    if (upsertErr) {
      console.error('[RUBRIC FEEDBACK] Upsert error:', upsertErr);
      return NextResponse.json(
        { error: 'Geri bildirim kaydedilemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[RUBRIC FEEDBACK] Unexpected:', err);
    return NextResponse.json(
      { error: 'Beklenmedik bir hata oluştu' },
      { status: 500 }
    );
  }
}
