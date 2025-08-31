// app/api/iyzico/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET metodu - İyzico bazen GET ile callback yapar
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=token_missing`
      );
    }

    // Token'ı success sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?token=${token}`
    );

  } catch (error) {
    console.error('verify-payment GET error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=get_failed`
    );
  }
}

// POST metodu - Mevcut kodunuz
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