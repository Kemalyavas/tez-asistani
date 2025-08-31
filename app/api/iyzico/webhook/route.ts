// app/api/iyzico/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Sunucu tarafı Supabase istemcisini oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key kullanılmalı
);

// Iyzico'nun webhook imzasını doğrulamak için KULLANILMASI GEREKEN DOĞRU yöntem
const generateSignature = (pkiString: string, secretKey: string): string => {
  return crypto
      .createHmac('sha256', secretKey)
      .update(pkiString)
      .digest('base64');
};

export async function POST(request: NextRequest) {
  try {
    const signatureFromIyzico = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    
    // Gelen isteğin ham metnini alıp JSON'a çevir
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Iyzico, imza için SADECE bu iki alanı bu sırada kullanır
    const pkiString = `iyziEventType=${body.iyziEventType},iyziReferenceCode=${body.iyziReferenceCode}`;
    
    // Gelen imza ile kendi oluşturduğumuz imzayı karşılaştır
    const generatedSignature = generateSignature(pkiString, secretKey);

    if (generatedSignature !== signatureFromIyzico) {
      console.warn('Iyzico Webhook: Geçersiz İmza!');
      console.log(' -> Gelen İmza:', signatureFromIyzico);
      console.log(' -> Oluşturulan İmza:', generatedSignature);
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    // İmza doğruysa ve ödeme başarılıysa, veritabanını güncelle
    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (conversationId && paymentDetails) {
        const userId = conversationId.split('_')[1];
        const basketItemId = paymentDetails.basketItems?.[0]?.id; // Örn: 'pro_monthly'
        
        if (userId && basketItemId) {
          const planType = basketItemId.split('_')[0]; // 'pro'
          
          await supabase
            .from('profiles')
            .update({
              subscription_status: planType, // 'pro' veya 'expert'
              subscription_plan: basketItemId,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      }
    }
    
    // Iyzico'ya "bildirimi aldım" demek için 200 OK dön
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK-HATA]', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}