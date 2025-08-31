// app/api/iyzico/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Iyzico'dan gelen POST isteğinin body'sini parse et
    const formData = await request.formData();
    const token = formData.get('token')?.toString();

    if (!token) {
      console.error('Iyzico Callback: Token bulunamadı.');
      // Kullanıcıyı bir hata sayfasına yönlendir
      return NextResponse.redirect(new URL('/payment/fail?error=token_missing', request.url));
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    });

    // Promise tabanlı bir yapı kullanarak Iyzico'dan sonucu al
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err: any, result: any) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    // Ödeme sonucunu kontrol et
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId;
      const userId = conversationId.split('_')[1];
      const planId = result.basketItems[0]?.id; // Örn: 'pro_monthly'

      if (userId && planId) {
        // Kullanıcının aboneliğini güncelle (Webhook'a ek olarak burada da yapılabilir)
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active', // veya planId'ye göre 'pro', 'expert'
            subscription_plan: planId,
            subscription_start_date: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      
      // Kullanıcıyı başarı sayfasına yönlendir
      return NextResponse.redirect(new URL('/payment/success', request.url));

    } else {
      // Ödeme başarısız olduysa, kullanıcıyı hata sayfasına yönlendir
      console.error('Iyzico ödeme başarısız:', result.errorMessage);
      return NextResponse.redirect(new URL(`/payment/fail?error=${result.errorMessage}`, request.url));
    }

  } catch (error: any) {
    console.error('Iyzico Callback Hatası:', error);
    return NextResponse.redirect(new URL(`/payment/fail?error=server_error`, request.url));
  }
}