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
const verifySignature = (body: any, signature: string, secretKey: string): boolean => {
  const dataToHash = body.iyziEventType + body.iyziReferenceCode + secretKey;
  const hash = crypto.createHash('sha1').update(dataToHash).digest('base64');
  return hash === signature;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY!;

    // 1. Gelen isteğin Iyzico'dan geldiğini doğrula (ÇOK ÖNEMLİ GÜVENLİK ADIMI)
    // if (!signature || !verifySignature(body, signature, secretKey)) {
    //   console.warn('Iyzico Webhook: Geçersiz imza.');
    //   return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    // }

    console.log('Iyzico Webhook:', body.iyziEventType, 'Ödeme Durumu:', body.paymentStatus);

    // 2. Sadece başarılı ödeme bildirimlerini işle
    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData; // Sepet bilgileri burada
      
      if (!conversationId || !paymentDetails) {
         console.error('Iyzico Webhook: Gerekli bilgiler eksik.', body);
         return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      const userId = conversationId.split('_')[1]; // conv_USERID_timestamp formatından userId'yi al
      const planId = paymentDetails.basketItems[0]?.id; // Plan ID'sini sepetten al
      
      if (!userId || !planId) {
        console.error('Iyzico Webhook: userId veya planId alınamadı.', { conversationId, paymentDetails });
        return NextResponse.json({ error: 'Kullanıcı veya Plan ID alınamadı' }, { status: 400 });
      }

      // 3. Kullanıcının aboneliğini veritabanında güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'premium', // veya planId'ye göre 'pro', 'expert'
          subscription_plan: planId,
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Webhook - Supabase abonelik güncelleme hatası:', updateError);
        // Hata durumunda bile Iyzico'ya başarılı yanıt dönmek önemlidir,
        // yoksa Iyzico tekrar tekrar bildirim gönderir. Hata log'lanmalıdır.
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