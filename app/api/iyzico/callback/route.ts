// app/api/iyzico/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';
import { URLSearchParams } from 'url';

export const dynamic = 'force-dynamic';

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

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    if (result && result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const { conversationId, basketItems } = result;
      const userId = conversationId?.split('_')[1];
      const planId = basketItems?.[0]?.id?.split('_')[0];

      if (userId && planId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: planId, subscription_plan: planId })
          .eq('id', userId);
      }
      
      return NextResponse.redirect(new URL('/payment/success', request.nextUrl));
    } else {
      const errorMessage = encodeURIComponent(result?.errorMessage || 'odeme_basarisiz');
      return NextResponse.redirect(new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl));
    }
  } catch (error: any) {
    console.error('[CALLBACK-KRİTİK-HATA]', error.message);
    return NextResponse.redirect(new URL(`/payment/fail?error=sunucu_hatasi`, request.nextUrl));
  }
}