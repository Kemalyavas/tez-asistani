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
      // Başarılı ödemede kullanıcı bilgilerini güncelle
      try {
        console.log('[ÖDEME-BAŞARILI] Kullanıcı veritabanı güncelleniyor...');
        
        // Basketid ve conversationId'den kullanıcı ID'sini çıkar
        const basketId = result.basketId || '';
        const userId = basketId.split('_')[1];
        
        // İşlem detaylarından plan bilgisini al
        const itemId = result.itemTransactions?.[0]?.itemId || '';
        const planType = itemId.split('_')[0]; // "pro" veya "expert"
        
        console.log('[ÖDEME-DETAY]', {
          userId,
          planType,
          basketId,
          itemId,
          paymentId: result.paymentId
        });
        
        // Supabase client import edilmediği için doğrudan import ediyoruz
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin yetkisiyle güncellemek için Service Role Key kullan
        );
        
        // Kullanıcı profilini güncelle
        const { data, error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'premium', // Sabit değer olarak premium kullan
            subscription_plan: planType,
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select();
          
        if (error) {
          console.error('[VERİTABANI-HATA]', error);
        } else {
          console.log('[KULLANICI-GÜNCELLENDİ]', data);
        }
      } catch (dbError) {
        console.error('[VERİTABANI-GÜNCELLENİRKEN-HATA]', dbError);
        // Hata olsa bile kullanıcıyı başarılı sayfasına yönlendir
      }
      
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