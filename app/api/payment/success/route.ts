// app/payment/success/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Iyzico callback GET ile geliyor (bazı durumlarda)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      console.error('Payment success: Token not found in query params');
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    // Token'ı query param olarak ekleyerek success page'e redirect
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Payment success GET error:', error);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/json')) {
      // JSON formatında gelen istek
      const jsonData = await request.json();
      token = jsonData.token;
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Form data formatında gelen istek
      const formData = await request.formData();
      token = formData.get('token') as string;
    } else {
      console.error('Payment success: Unsupported content type:', contentType);
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    if (!token) {
      console.error('Payment success: Token not found');
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
