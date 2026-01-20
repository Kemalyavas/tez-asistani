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
      const userIdPartial = basketParts[1]; // İlk 8 karakter
      const packageId = basketParts[2];

      if (!userIdPartial || !packageId) {
        console.error('[WEBHOOK] userId veya packageId alınamadı:', { basketId });
        return NextResponse.json({ error: 'Geçersiz basket formatı' }, { status: 400 });
      }

      // Kredi paketi kontrolü
      const creditPackage = CREDIT_PACKAGES[packageId];
      if (!creditPackage) {
        console.error('[WEBHOOK] Geçersiz paket ID:', packageId);
        return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 });
      }

      console.log('[WEBHOOK] Kredi ekleniyor:', { userIdPartial, packageId, credits: creditPackage.credits });

      const supabase = getSupabaseAdmin();

      // Kullanıcıyı bul (tam UUID ile eşleştir)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${userIdPartial}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        console.error('[WEBHOOK] Kullanıcı bulunamadı:', userIdPartial);
        return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
      }

      const fullUserId = profiles[0].id;

      // Daha önce işlenmiş mi kontrol et (idempotency)
      const { data: existingPayment } = await supabase
        .from('payment_history')
        .select('id, status')
        .eq('payment_id', paymentId)
        .single();

      if (existingPayment?.status === 'success') {
        console.log('[WEBHOOK] Bu ödeme zaten işlenmiş:', paymentId);
        return NextResponse.json({ status: 'already_processed' });
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
      await supabase
        .from('payment_history')
        .update({
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WEBHOOK-HATA]', error.message);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}