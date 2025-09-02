import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const generateSignature = (pkiString: string, secretKey: string): string => {
  return crypto.createHmac('sha256', secretKey).update(pkiString).digest('base64');
};

export async function POST(request: NextRequest) {
  try {
    const signatureFromIyzico = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const pkiString = `iyziEventType=${body.iyziEventType},iyziReferenceCode=${body.iyziReferenceCode}`;
    const generatedSignature = generateSignature(pkiString, secretKey);

    if (generatedSignature !== signatureFromIyzico) {
      console.warn('Webhook Geçersiz İmza!');
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      console.log('[WEBHOOK] Başarılı ödeme webhook bildirimi alındı:', body);
      
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (!conversationId || !paymentDetails) {
         console.error('[WEBHOOK] Gerekli bilgiler eksik.', body);
         return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      const userId = conversationId.split('_')[1]; // conv_USERID_timestamp formatından userId'yi al
      const basketItemId = paymentDetails.basketItems?.[0]?.id; // Plan ID'sini sepetten al
      
      if (!userId || !basketItemId) {
        console.error('[WEBHOOK] userId veya basketItemId alınamadı:', { conversationId, paymentDetails });
        return NextResponse.json({ error: 'Kullanıcı veya Plan ID alınamadı' }, { status: 400 });
      }
      
      console.log('[WEBHOOK] Kullanıcı güncelleniyor:', { userId, basketItemId });
      
      // Kullanıcının aboneliğini veritabanında güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'premium', // Sabit 'premium' değeri kullan
          subscription_plan: basketItemId,
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[WEBHOOK] Veritabanı güncelleme hatası:', updateError);
      } else {
        console.log(`[WEBHOOK] Kullanıcı ${userId} için premium abonelik başarıyla aktifleştirildi`);
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WEBHOOK-HATA]', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}