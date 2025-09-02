// app/api/iyzico/webhook/route.ts
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
      const { conversationId, paymentConversationData } = body;
      const userId = conversationId?.split('_')[1];
      const basketItemId = paymentConversationData?.basketItems?.[0]?.id;
      
      if (userId && basketItemId) {
        const planType = basketItemId.split('_')[0];
        await supabase
          .from('profiles')
          .update({
            subscription_status: planType,
            subscription_plan: basketItemId,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WEBHOOK-HATA]', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}