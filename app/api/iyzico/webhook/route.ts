// app/api/iyzico/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Sunucu tarafı Supabase istemcisini oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // DİKKAT: Service Role Key kullanılmalı
);

// Iyzico'dan gelen bildirimleri doğrulamak için kullanılan fonksiyon
// HATA DÜZELTME BAŞLANGICI: İmza doğrulama mantığı güncellendi.
const createSignature = (secretKey: string, body: string): string => {
  return crypto
    .createHmac('sha1', secretKey)
    .update(body)
    .digest('base64');
};
// HATA DÜZELTME SONU

export async function POST(request: NextRequest) {
  try {
    // HATA DÜZELTME: request.json() yerine request.text() kullanılıyor.
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const signature = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY;

    if (!signature || !secretKey) {
        console.error('Iyzico Webhook: İmza veya gizli anahtar ortam değişkenlerinde (environment variables) eksik.');
        return NextResponse.json({ error: 'Yapılandırma hatası: İmza veya anahtar eksik' }, { status: 401 });
    }

    // 1. Gelen isteğin Iyzico'dan geldiğini doğrula
    const expectedSignature = createSignature(secretKey, rawBody);
    if (signature !== expectedSignature) {
      console.warn('Iyzico Webhook: Geçersiz imza.');
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    console.log('Iyzico Webhook:', body.iyziEventType, 'Ödeme Durumu:', body.paymentStatus);

    // 2. Sadece başarılı ödeme bildirimlerini işle
    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (!conversationId || !paymentDetails) {
         console.error('Iyzico Webhook: Gerekli bilgiler eksik.', body);
         return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      const userId = conversationId.split('_')[1];
      const planId = paymentDetails.basketItems[0]?.id;
      
      if (!userId || !planId) {
        console.error('Iyzico Webhook: userId veya planId alınamadı.', { conversationId, paymentDetails });
        return NextResponse.json({ error: 'Kullanıcı veya Plan ID alınamadı' }, { status: 400 });
      }

      // 3. Kullanıcının aboneliğini veritabanında güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active', // veya planId'ye göre 'pro', 'expert'
          subscription_plan: planId,
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Webhook - Supabase abonelik güncelleme hatası:', updateError);
      } else {
        console.log(`Kullanıcı ${userId} için abonelik başarıyla güncellendi: ${planId}`);
      }
    }

    // 4. Iyzico'ya bildirimi aldığımızı belirtmek için 200 OK yanıtı dön
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error: any) {
    console.error('Iyzico Webhook işleme hatası:', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}