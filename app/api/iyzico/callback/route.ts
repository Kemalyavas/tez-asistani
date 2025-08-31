// app/api/iyzico/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';
import { URLSearchParams } from 'url';

export const dynamic = 'force-dynamic'; // Bu satır Vercel'de dinamik çalışmasını sağlar

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get('token');

    if (!token) {
      console.error('[CALLBACK-ERROR] Iyzico returned no token.');
      return NextResponse.redirect(new URL('/payment/fail?error=token_missing', request.nextUrl));
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    });

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err, result) => {
        if (err || result.status !== 'success') {
          console.error('[CALLBACK-IYZICO-ERROR]', { err, result });
          return reject(err || new Error((result && (result as any).errorMessage) || 'Unknown error'));
        }
        resolve(result);
      });
    });

    if (result.paymentStatus === 'SUCCESS') {
      console.log('[CALLBACK-SUCCESS] Payment verified, redirecting to success page.');
      // Kullanıcıyı başarı sayfasına GET isteği ile yönlendir.
      return NextResponse.redirect(new URL('/payment/success', request.nextUrl));
    } else {
      console.error('[CALLBACK-PAYMENT-FAIL]', result);
      const errorMessage = encodeURIComponent(result.errorMessage || 'payment_failed');
      return NextResponse.redirect(new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl));
    }
  } catch (error: any) {
    console.error('[CALLBACK-FATAL-ERROR]', error);
    return NextResponse.redirect(new URL(`/payment/fail?error=server_error`, request.nextUrl));
  }
}