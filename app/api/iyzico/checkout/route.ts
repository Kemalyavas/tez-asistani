// app/api/iyzico/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';
import { URLSearchParams } from 'url';

export const dynamic = 'force-dynamic'; // Vercel'in bu rotayı dinamik olarak çalıştırmasını sağlar

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get('token');

    if (!token) {
      console.error('[CALLBACK-HATA] Iyzico token göndermedi.');
      return NextResponse.redirect(new URL('/payment/fail?error=token_yok', request.nextUrl));
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    });

    // Gelen token ile Iyzico'dan ödeme sonucunu sorgula
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err: any, result: any) => {
        if (err || result.status !== 'success') {
          console.error('[CALLBACK-IYZICO-HATA]', { err, result });
          const errorMsg = (err && err.errorMessage) ? err.errorMessage : 'Unknown error';
          return reject(err || new Error(errorMsg));
        }
        resolve(result);
      });
    });

    // Ödeme gerçekten başarılı ise veritabanını güncelle
    if (result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId;
      const userId = conversationId.split('_')[1];
      const planId = result.basketItems?.[0]?.id; // 'pro_monthly' gibi

      if (userId && planId) {
        // Supabase'de kullanıcının aboneliğini güncelle
        const { error: updateError } = await supabase.from('profiles').update({
            subscription_status: 'active', // veya 'pro', 'expert'
            subscription_plan: planId.split('_')[0], // 'pro'
          }).eq('id', userId);

        if (updateError) {
          console.error("[CALLBACK-DB-HATA] Supabase güncelleme hatası:", updateError);
        } else {
          console.log(`[CALLBACK-BAŞARILI] Kullanıcı ${userId} aboneliği güncellendi: ${planId}`);
        }
      }
      
      // Her şey tamamsa, kullanıcıyı BAŞARI sayfasına yönlendir
      return NextResponse.redirect(new URL('/payment/success', request.nextUrl));
    } else {
      console.error('[CALLBACK-ÖDEME-HATASI]', result);
      const errorMessage = encodeURIComponent(result.errorMessage || 'odeme_basarisiz');
      return NextResponse.redirect(new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl));
    }
  } catch (error: any) {
    console.error('[CALLBACK-KRİTİK-HATA]', error);
    return NextResponse.redirect(new URL(`/payment/fail?error=sunucu_hatasi`, request.nextUrl));
  }
}