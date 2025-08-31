import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// İyzico'dan gelen GET isteğini handle et
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return redirect('/payment/error?message=Token bulunamadı');
    }

    // Token'ı verify et
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/iyzico/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result = await verifyResponse.json();
    
    if (result.success) {
      // Başarılı - client sayfasına yönlendir
      return redirect('/payment/success/client?status=completed&paymentId=' + result.paymentId);
    } else {
      return redirect('/payment/error?message=' + encodeURIComponent(result.errorMessage || 'Ödeme başarısız'));
    }
    
  } catch (error) {
    console.error('Payment success route error:', error);
    return redirect('/payment/error?message=Bir hata oluştu');
  }
}

// POST isteği için (kullanılmayacak ama hata vermemesi için)
export async function POST(request: NextRequest) {
  // İyzico GET kullanıyor, redirect et
  const formData = await request.formData();
  const token = formData.get('token');
  
  if (token) {
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token.toString());
    return redirect(successUrl.toString());
  }
  
  return NextResponse.json({ error: 'Token bulunamadı' }, { status: 400 });
}