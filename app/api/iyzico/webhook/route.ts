// app/api/iyzico/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Iyzico webhook imzasını doğrulamak için DOĞRU fonksiyon
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
    
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Iyzico'nun imza için kullandığı metin SADECE bu iki alandan oluşur
    const pkiString = `iyziEventType=${body.iyziEventType},iyziReferenceCode=${body.iyziReferenceCode}`;
    
    const generatedSignature = generateSignature(pkiString, secretKey);

    if (generatedSignature !== signatureFromIyzico) {
      console.warn('Iyzico Webhook: Geçersiz İmza!');
      console.log(' -> Gelen İmza:', signatureFromIyzico);
      console.log(' -> Oluşturulan İmza:', generatedSignature);
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (conversationId && paymentDetails) {
        const userId = conversationId.split('_')[1];
        const planId = paymentDetails.basketItems?.[0]?.id;
            
        if (userId && planId) {
          await supabase.from('profiles').update({
              subscription_status: 'active',
              subscription_plan: planId,
              subscription_start_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
          }).eq('id', userId);
          console.log(`[WEBHOOK-SUCCESS] User ${userId} subscription updated to ${planId}.`);
        }
      }
    }
    
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK-FATAL-ERROR]', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}