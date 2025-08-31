// app/api/iyzico/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let token: string | null = null;

    // Önce formData dene
    try {
      const formData = await request.formData();
      token = formData.get('token') as string | null;
    } catch {
      // Eğer formData değilse JSON dene
      const body = await request.json().catch(() => null);
      if (body && body.token) token = body.token;
    }

    if (!token) {
      // Token yoksa hata sayfasına yönlendir
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=token_missing`
      );
    }

    // Başarılı → success sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?token=${token}`
    );

  } catch (error) {
    console.error('verify-payment POST error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=post_failed`
    );
  }
}
