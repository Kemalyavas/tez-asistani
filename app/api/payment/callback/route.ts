import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
  try {
    // HATA DÜZELTME BAŞLANGICI: formData() yerine text() ve URLSearchParams kullanıldı.
    const body = await request.text();
    const params = new URLSearchParams(body);
    const token = params.get('token');
    // HATA DÜZELTME SONU
    
    if (!token) {
      // Token yoksa hata sayfasına yönlendir (veya anasayfaya/fiyatlar sayfasına)
      const errorUrl = new URL('/pricing?error=token_missing', request.url);
      return NextResponse.redirect(errorUrl);
    }

    // Token'ı alıp, client tarafında doğrulanması için success sayfasına
    // query parametresi olarak ekleyip yönlendiriyoruz.
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set('status', 'completed'); // Başarı durumunu da ekleyelim.

    return NextResponse.redirect(successUrl.toString());
    
  } catch (error) {
    console.error('Payment callback error:', error);
    // Herhangi bir hata durumunda kullanıcıyı fiyatlandırma sayfasına geri yönlendir
    const errorUrl = new URL('/pricing?error=callback_failed', request.url);
    return NextResponse.redirect(errorUrl);
  }
}

export async function GET(request: NextRequest) {
  // GET isteği için bir değişiklik gerekmiyor, ancak güvenlik açısından
  // success sayfasına yönlendirirken status parametresini eklemek tutarlılık sağlar.
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (token) {
     const successUrl = new URL('/payment/success', request.url);
     successUrl.searchParams.set('token', token);
     successUrl.searchParams.set('status', 'completed');
     return NextResponse.redirect(successUrl.toString());
  }
  
  const errorUrl = new URL('/pricing?error=token_not_found', request.url);
  return NextResponse.redirect(errorUrl);
}