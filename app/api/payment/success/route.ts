// app/payment/success/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Iyzico'dan gelen form data'yı al
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      console.error('Payment success: Token not found in form data');
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    // Token'ı query param olarak ekleyerek success page'e redirect
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Payment success route error:', error);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }
}
