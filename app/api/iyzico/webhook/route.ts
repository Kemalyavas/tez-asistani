// app/api/iyzico/webhook/route.ts
// Iyzico Webhook Handler - Credit System
// Bu webhook, Iyzico'dan gelen ödeme bildirimlerini işler ve kullanıcıya kredi ekler

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { CREDIT_PACKAGES } from '../../../lib/pricing';

// Service role ile Supabase client oluştur (admin işlemleri için)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Iyzico imza doğrulama
const generateSignature = (pkiString: string, secretKey: string): string => {
  return crypto.createHmac('sha256', secretKey).update(pkiString).digest('base64');
};

export async function POST(request: NextRequest) {
  try {
    const signatureFromIyzico = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY!;

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // İmza doğrulama
    const pkiString = `iyziEventType=${body.iyziEventType},iyziReferenceCode=${body.iyziReferenceCode}`;
    const generatedSignature = generateSignature(pkiString, secretKey);

    if (generatedSignature !== signatureFromIyzico) {
      console.warn('[WEBHOOK] Geçersiz imza!');
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    // Başarılı ödeme bildirimi
    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      console.log('[WEBHOOK] Başarılı ödeme bildirimi alındı');

      const conversationId = body.conversationId;
      const basketId = body.basketId;
      const paymentId = body.paymentId;

      if (!conversationId || !basketId) {
        console.error('[WEBHOOK] Gerekli bilgiler eksik:', { conversationId, basketId });
        return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      // basketId format: basket_<userId8>_<packageId>_<timestamp>
      const basketParts = basketId.split('_');
      const packageId = basketParts[2];

      if (!packageId) {
        console.error('[WEBHOOK] packageId alınamadı:', { basketId });
        return NextResponse.json({ error: 'Geçersiz basket formatı' }, { status: 400 });
      }

      // Kredi paketi kontrolü
      const creditPackage = CREDIT_PACKAGES[packageId];
      if (!creditPackage) {
        console.error('[WEBHOOK] Geçersiz paket ID:', packageId);
        return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();

      // FIXED: Get user_id directly from payment_history (stored during checkout)
      // This avoids UUID collision risk from parsing basketId
      const { data: pendingPayment, error: pendingError } = await supabase
        .from('payment_history')
        .select('id, user_id, status, payment_id')
        .or(`payment_id.eq.${paymentId},conversation_id.eq.${conversationId}`)
        .limit(1)
        .single();

      if (pendingError || !pendingPayment) {
        console.error('[WEBHOOK] Ödeme kaydı bulunamadı:', { paymentId, conversationId });
        return NextResponse.json({ error: 'Ödeme kaydı bulunamadı' }, { status: 404 });
      }

      const fullUserId = pendingPayment.user_id;
      console.log('[WEBHOOK] Kredi ekleniyor:', { userId: fullUserId, packageId, credits: creditPackage.credits });

      // Daha önce işlenmiş mi kontrol et (idempotency)
      if (pendingPayment.status === 'success') {
        console.log('[WEBHOOK] Bu ödeme zaten işlenmiş:', paymentId);

        // FIXED: Verify credits were actually added by checking credit_transactions
        const { data: creditTx } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('payment_id', paymentId)
          .limit(1);

        if (!creditTx || creditTx.length === 0) {
          // Payment marked success but credits not added - need to add credits
          console.warn('[WEBHOOK] Ödeme başarılı işaretli ama kredi eksik, tekrar deneniyor...');
        } else {
          return NextResponse.json({ status: 'already_processed' });
        }
      }

      // Kredi ekle (RPC fonksiyonu ile)
      const { data: creditResult, error: creditError } = await supabase.rpc('add_credits', {
        p_user_id: fullUserId,
        p_amount: creditPackage.credits,
        p_bonus: creditPackage.bonusCredits,
        p_payment_id: paymentId,
        p_package_id: packageId
      });

      if (creditError) {
        console.error('[WEBHOOK] Kredi ekleme hatası:', creditError);
        return NextResponse.json({ error: 'Kredi eklenemedi' }, { status: 500 });
      }

      const addResult = creditResult?.[0];
      console.log('[WEBHOOK] Kredi başarıyla eklendi:', {
        userId: fullUserId,
        credits: creditPackage.credits,
        bonus: creditPackage.bonusCredits,
        newBalance: addResult?.new_balance
      });

      // Payment history güncelle
      // Match by conversationId since initial payment_id was token, not paymentId
      await supabase
        .from('payment_history')
        .update({
          payment_id: paymentId, // Update to real Iyzico paymentId
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WEBHOOK-HATA]', error.message);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}