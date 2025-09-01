// app/payment/success/route.ts
// İyzico hala buraya POST gönderiyor, callback olarak kullan

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('İyzico POST request to /payment/success');
    
    const contentType = request.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      token = jsonData.token;
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      token = formData.get('token') as string;
    } else {
      // İyzico bazı durumlarda farklı format gönderebilir
      try {
        const formData = await request.formData();
        token = formData.get('token') as string;
      } catch {
        // Form data da çalışmazsa URL'den al
        const { searchParams } = new URL(request.url);
        token = searchParams.get('token');
      }
    }

    console.log('Extracted token:', token);

    if (!token) {
      console.error('Payment success: Token not found');
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    // Token ile success page'e yönlendir
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token);

    console.log('Redirecting to:', successUrl.toString());
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Payment success route error:', error);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }
}

export async function GET(request: NextRequest) {
  // GET için de destek
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const successUrl = new URL('/payment/success', request.url);
  successUrl.searchParams.set('token', token);
  
  return NextResponse.redirect(successUrl);
}
