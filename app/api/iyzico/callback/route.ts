// app/api/iyzico/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';
import { URLSearchParams } from 'url';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Iyzico'dan gelen body'yi text olarak oku ve URLSearchParams ile parse et.
    // Bu, formData() metodundan daha güvenilirdir.
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get('token');

    if (!token) {
      console.error('Iyzico Callback: Token alınamadı.');
      return NextResponse.redirect(new URL('/payment/fail?error=token_missing', request.url));
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    });

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // ÖNEMLİ: result objesinin ve gerekli alanların varlığını kontrol et
    if (result && result.status === 'success' && result.paymentStatus === 'SUCCESS' && result.conversationId) {
      const conversationId = result.conversationId;
      const userId = conversationId.split('_')[1];
      const planId = result.basketItems && result.basketItems[0] ? result.basketItems[0].id : null;

      if (userId && planId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: planId,
            subscription_start_date: new Date().toISOString(),
          })
          .eq('id', userId);
      } else {
         console.error('Callback: userId veya planId alınamadı.', { conversationId, basketItems: result.basketItems });
      }

      return NextResponse.redirect(new URL('/payment/success', request.url));

    } else {
      console.error('Iyzico ödemesi başarısız veya eksik veri:', result?.errorMessage || 'Bilinmeyen Hata');
      const errorMessage = result?.errorMessage ? encodeURIComponent(result.errorMessage) : 'payment_failed';
      return NextResponse.redirect(new URL(`/payment/fail?error=${errorMessage}`, request.url));
    }

  } catch (error: any) {
    console.error('Iyzico Callback Genel Hata:', error);
    return NextResponse.redirect(new URL(`/payment/fail?error=server_error`, request.url));
  }
}