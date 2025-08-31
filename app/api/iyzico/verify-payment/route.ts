import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Iyzipay from 'iyzipay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.IYZICO_BASE_URL!
});

// Ödeme doğrulama ve veritabanı güncelleme mantığını tek bir fonksiyonda toplayalım
async function handleVerification(token: string) {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve({ token }, async (err: any, result: any) => {
      if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
        console.error('Iyzico doğrulama hatası:', err || result.errorMessage);
        return reject({ error: 'Ödeme doğrulanamadı veya başarısız oldu.', status: 400 });
      }

      try {
        const conversationId = result.conversationId;
        const userId = conversationId.split('_')[1];
        const planInfo = result.basketItems[0].id; // Örn: "pro_monthly"
        const planId = planInfo.split('_')[0]; // Sadece "pro" veya "expert"

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: planId, // 'pro' veya 'expert' olarak güncelle
            subscription_plan: planInfo,
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Supabase abonelik güncelleme hatası:', updateError);
          // Hata olsa bile ödeme başarılı olduğu için kullanıcıya olumlu dönüyoruz.
          // Bu hata ayrıca loglanıp incelenmeli.
        }

        resolve({
          success: true,
          plan_name: result.basketItems[0].name,
          amount: result.paidPrice,
          currency: result.currency,
          payment_id: result.paymentId
        });
      } catch (dbError) {
        console.error('Veritabanı güncelleme hatası:', dbError);
        reject({ error: 'Veritabanı hatası.', status: 500 });
      }
    });
  });
}

// Iyzico'dan gelen POST isteğini handle etmek için
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 400 });
    }

    const verificationResult = await handleVerification(token);
    // Başarılı doğrulama sonrası kullanıcıyı success sayfasına yönlendiriyoruz
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('status', 'verified'); // Sayfaya durum bilgisi ekleyebiliriz
    return NextResponse.redirect(successUrl.toString());

  } catch (error: any) {
    console.error('POST /verify-payment error:', error);
    const errorUrl = new URL('/pricing', request.url);
    errorUrl.searchParams.set('error', error.error || 'dogrulama_basarisiz');
    return NextResponse.redirect(errorUrl.toString());
  }
}

// Client tarafından gelen GET isteğini handle etmek için
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 400 });
    }

    const verificationResult = await handleVerification(token);
    return NextResponse.json(verificationResult);

  } catch (error: any) {
    console.error('GET /verify-payment error:', error);
    return NextResponse.json({ error: error.error || 'Ödeme doğrulanamadı' }, { status: error.status || 500 });
  }
}