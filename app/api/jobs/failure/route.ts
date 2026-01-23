import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature, setJobStatus, AnalysisJob } from '@/app/lib/queue/qstash';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // QStash signature doğrulama
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      const isValid = await verifyQStashSignature(signature, body);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const failureData = JSON.parse(body);

    console.error('[Failure] Job failed:', {
      messageId: failureData.messageId,
      error: failureData.error,
      url: failureData.url,
    });

    // Orijinal job verisini al
    let job: AnalysisJob | null = null;
    try {
      if (failureData.body) {
        job = JSON.parse(failureData.body);
      }
    } catch {}

    if (job) {
      // Durumu failed olarak güncelle
      await setJobStatus(job.documentId, {
        documentId: job.documentId,
        step: job.step,
        totalSteps: job.totalSteps,
        stepName: 'Hata',
        status: 'failed',
        progress: 0,
        error: failureData.error || 'Job başarısız oldu',
      });

      // Veritabanını güncelle
      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'failed',
          processing_status: {
            step: job.step,
            totalSteps: job.totalSteps,
            stepName: 'Hata',
            status: 'failed',
            error: failureData.error || 'Analiz işlemi başarısız oldu',
          },
        })
        .eq('id', job.documentId);

      // Kredi iadesi yap
      const { data: document } = await supabaseAdmin
        .from('thesis_documents')
        .select('credits_used, user_id')
        .eq('id', job.documentId)
        .single();

      if (document && document.credits_used > 0) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: document.user_id,
          p_amount: document.credits_used,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null,
        });

        // İade işlemini logla
        await supabaseAdmin.from('credit_transactions').insert({
          user_id: document.user_id,
          amount: document.credits_used,
          transaction_type: 'refund',
          action_type: 'thesis_analysis_failed',
          description: `Başarısız analiz için iade: ${job.documentId}`,
        });

        console.log(`[Failure] Refunded ${document.credits_used} credits for document: ${job.documentId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Failure] Error handling failure:', error);
    return NextResponse.json(
      { error: 'Failure handling hatası' },
      { status: 500 }
    );
  }
}
