// app/api/iyzico/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createPkiString = (json: any): string => {
  return Object.keys(json)
    .sort()
    .map(key => {
      const value = json[key];
      // Iyzico'nun beklediği formatta null veya undefined değerler atlanmalı
      if (value === null || value === undefined) {
        return '';
      }
      return `${key}=${value}`;
    })
    .join(',');
};

const verifySignatureV2 = (pkiString: string, signature: string, secretKey: string): boolean => {
    const hash = crypto
        .createHmac('sha256', secretKey)
        .update(pkiString)
        .digest('base64');
    return hash === signature;
};

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-iyzi-signature');
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const pkiString = createPkiString(body);
    
    if (!signature || !verifySignatureV2(pkiString, signature, secretKey)) {
        console.warn('Iyzico Webhook: Geçersiz imza.');
        return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 });
    }

    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (!conversationId || !paymentDetails) {
         return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      const userId = conversationId.split('_')[1];
      const planId = paymentDetails.basketItems[0]?.id;
      
      if (!userId || !planId) {
        return NextResponse.json({ error: 'Kullanıcı veya Plan ID alınamadı' }, { status: 400 });
      }

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: planId,
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Iyzico Webhook işleme hatası:', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}