import { NextRequest, NextResponse } from 'next/server';
import Iyzipay from 'iyzipay';
import { URLSearchParams } from 'url';

export const dynamic = 'force-dynamic';

// GET isteği için handler - tarayıcıdan doğrudan URL ziyaretleri için
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      console.error('[HATA] Token bulunamadı (GET)');
      return NextResponse.redirect(new URL('/payment/fail?error=token_yok', request.nextUrl), { status: 303 });
    }

    // Aynı işlemi GET isteği için de gerçekleştir
    return verifyAndRedirect(token, request);
  } catch (error: any) {
    console.error('[KRİTİK-HATA] GET:', error.message);
    return NextResponse.redirect(new URL(`/payment/fail?error=sunucu_hatasi`, request.nextUrl), { status: 303 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get('token');

    if (!token) {
      console.error('[HATA] Iyzico token göndermedi.');
      return NextResponse.redirect(new URL('/payment/fail?error=token_yok', request.nextUrl));
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    });

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err, res) => {
        if (err) {
          console.error('[IYZICO-HATA]', { err, res });
          return reject(err);
        }
        resolve(res);
      });
    });

    return verifyAndRedirect(token, request, result);
  } catch (error: any) {
    console.error('[KRİTİK-HATA]', error.message);
    return NextResponse.redirect(new URL(`/payment/fail?error=sunucu_hatasi`, request.nextUrl), { status: 303 });
  }
}

// Yardımcı fonksiyon - Hem GET hem de POST istekleri için aynı doğrulama mantığını kullanır
async function verifyAndRedirect(token: string, request: NextRequest, result?: any) {
  if (!token) {
    console.error('[HATA] Token bulunamadı');
    return NextResponse.redirect(new URL('/payment/fail?error=token_yok', request.nextUrl), { status: 303 });
  }
  
  try {
    // Eğer result parametresi verilmediyse (GET isteği durumu), iyzipay'den bilgileri al
    if (!result) {
      const iyzipay = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY!,
        secretKey: process.env.IYZICO_SECRET_KEY!,
        uri: process.env.IYZICO_BASE_URL!,
      });
      
      result = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutForm.retrieve({ token }, (err, res) => {
          if (err) {
            console.error('[IYZICO-HATA]', { err, res });
            return reject(err);
          }
          resolve(res);
        });
      });
    }
    
    if (result && result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      // 303 kodu kullanarak POST isteğini GET isteğine dönüştür
      return NextResponse.redirect(new URL('/payment/success', request.nextUrl), { status: 303 });
    } else {
      const errorMessage = encodeURIComponent(result?.errorMessage || 'odeme_basarisiz');
      // 303 kodu kullanarak POST isteğini GET isteğine dönüştür
      return NextResponse.redirect(new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl), { status: 303 });
    }
  } catch (error: any) {
    console.error('[DOĞRULAMA-HATASI]', error.message);
    return NextResponse.redirect(new URL(`/payment/fail?error=dogrulama_hatasi`, request.nextUrl), { status: 303 });
  }
}