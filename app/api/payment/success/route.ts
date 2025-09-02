// app/api/payment/success/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Bu endpoint, İyzico'nun doğrudan /api/payment/success'e POST yaptığı durumları ele alır
// Burada basitçe /payment/success sayfasına 303 durum koduyla yönlendiriyoruz

export async function POST(request: NextRequest) {
  console.log('[ÖDEME-API] İyzico payment success endpoint POST');
  
  // POST isteğini GET'e çevirerek başarı sayfasına yönlendir
  return NextResponse.redirect(new URL('/payment/success', request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  console.log('[ÖDEME-API] İyzico payment success endpoint GET');
  
  // GET isteğini doğrudan başarı sayfasına yönlendir
  return NextResponse.redirect(new URL('/payment/success', request.url), { status: 303 });
}
