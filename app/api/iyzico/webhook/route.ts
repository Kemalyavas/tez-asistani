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
    if (!rawBody) {
      return NextResponse.json({ error: 'Boş istek gövdesi' }, { status: 400 });
    }
    const body = JSON.parse(rawBody);

    const pkiString = `iyziEventType=${body.iyziEventType},iyziReferenceCode=${body.iyziReferenceCode}`;
    const generatedSignature = generateSignature(pkiString, secretKey);

    if (generatedSignature !== signatureFromIyzico) {
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const { conversationId, paymentConversationData } = body;
      const userId = conversationId?.split('_')[1];
      const basketItemId = paymentConversationData?.basketItems?.[0]?.id;
      
      if (userId && basketItemId) {
        const planType = basketItemId.split('_')[0];
        const billingCycle = basketItemId.split('_')[1] || 'monthly';
        const now = new Date();
        let subscriptionEndDate = new Date();
        billingCycle === 'yearly' ? subscriptionEndDate.setFullYear(now.getFullYear() + 1) : subscriptionEndDate.setMonth(now.getMonth() + 1);

        await supabase
          .from('profiles')
          .update({
            subscription_status: planType,
            subscription_plan: basketItemId,
            subscription_start_date: now.toISOString(),
            subscription_end_date: subscriptionEndDate.toISOString(),
            billing_cycle: billingCycle,
            updated_at: now.toISOString()
          })
          .eq('id', userId);
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Geçersiz JSON formatı' }, { status: 400 });
    }
    console.error('[WEBHOOK-HATA]', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}