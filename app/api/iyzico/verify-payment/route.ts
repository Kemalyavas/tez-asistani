// app/api/iyzico/verify-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Iyzico'dan gelen POST isteğini bu dosya karşılayacak
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      // Token yoksa hata sayfasına yönlendir
      const errorUrl = new URL('/pricing?error=token_missing', request.url);
      return NextResponse.redirect(errorUrl);
    }

    // Token'ı alıp, client tarafında doğrulanması için success sayfasına
    // query parametresi olarak ekleyip yönlendiriyoruz.
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token);

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('Success POST error:', error);
    // Herhangi bir hata durumunda kullanıcıyı fiyatlandırma sayfasına geri yönlendir
    const errorUrl = new URL('/pricing?error=post_failed', request.url);
    return NextResponse.redirect(errorUrl);
  }
}