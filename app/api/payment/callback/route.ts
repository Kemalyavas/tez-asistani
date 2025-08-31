import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token');
    
    if (!token) {
      return redirect('/payment/error?message=Token bulunamadı');
    }

    // Token'ı verify et
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/iyzico/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: token.toString() }),
    });

    const result = await verifyResponse.json();
    
    if (result.success) {
      return redirect('/payment/success?status=completed');
    } else {
      return redirect('/payment/error?message=' + encodeURIComponent(result.errorMessage || 'Ödeme başarısız'));
    }
    
  } catch (error) {
    console.error('Payment callback error:', error);
    return redirect('/payment/error?message=Bir hata oluştu');
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (token) {
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/iyzico/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result = await verifyResponse.json();
    
    if (result.success) {
      return redirect('/payment/success?status=completed');
    } else {
      return redirect('/payment/error?message=' + encodeURIComponent(result.errorMessage || 'Ödeme başarısız'));
    }
  }
  
  return redirect('/payment/error?message=Token bulunamadı');
}