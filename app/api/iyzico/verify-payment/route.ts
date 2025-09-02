import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Iyzipay from 'iyzipay'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.IYZICO_BASE_URL!
});

/**
 * Bu fonksiyon hem GET hem de POST isteklerini işler.
 * Iyzico'dan gelen POST isteğini yakalar ve kullanıcıyı bir sonuç sayfasına yönlendirir.
 * Kullanıcı sayfayı yenilerse (GET) veya URL'yi kopyalarsa da çalışır.
 */
async function handlePaymentVerification(request: NextRequest): Promise<NextResponse> {

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    let token: string | null = null;

    if (request.method === 'POST') {
      // Iyzico genellikle application/x-www-form-urlencoded formatında POST eder.
      // Next.js'in NextRequest.formData() metodu bunu işler.
      // Eğer başarısız olursa, non-standard Content-Type veya hatalı body olabilir.
      try {
        const contentType = request.headers.get('content-type');
        if (contentType && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data'))) {
          const formData = await request.formData();
          token = formData.get('token') as string;
        } else {
          // Diğer içerik türleri için fallback, örn. düz metin veya beklenmedik türler
          const textBody = await request.text();
          const params = new URLSearchParams(textBody);
          token = params.get('token');
        }
      } catch (e) {
        console.error('POST body ayrıştırma hatası:', e);
        // Ayrıştırma başarısız olursa, token null kalır, bu da hata yönlendirmesine yol açar.
      }
    } else if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      token = searchParams.get('token');
    }

    if (!token) {
      const failureUrl = new URL('/payment/status', siteUrl);
      failureUrl.searchParams.set('status', 'failure');
      failureUrl.searchParams.set('error', 'Ödeme token bilgisi bulunamadı.');
      return NextResponse.redirect(failureUrl, { status: 303 });
    }

    return new Promise<NextResponse>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token: token as string }, async (err: any, result: any) => {
        console.log('Iyzico retrieve result:', result)
        console.log('Error:', err)
        if (err) {
          console.error('Iyzico retrieve error:', err);
          const failureUrl = new URL('/payment/status', siteUrl);
          failureUrl.searchParams.set('status', 'failure');
          failureUrl.searchParams.set('error', 'Ödeme sağlayıcısı ile doğrulama başarısız oldu.');
          resolve(NextResponse.redirect(failureUrl, { status: 303 }));
        } else if (result.status === 'success') {
          // Ödeme başarılı. Webhook zaten asıl güncellemeyi yapıyor.
          // Burası kullanıcıyı bilgilendirme ve yönlendirme amaçlı.
          try {
            console.log('[VERIFY-PAYMENT] Ödeme doğrulama başarılı, kullanıcı güncelleniyor');
            const basketId = result.basketId
            const userId = basketId.split('_')[1]
            const itemId = result.itemTransactions[0].itemId
            const plan = itemId.split('_')[0]
            
            console.log('[VERIFY-PAYMENT] Kullanıcı bilgileri:', { 
              userId, 
              plan, 
              basketId, 
              itemId,
              paymentId: result.paymentId
            })
            
            // Webhook'a ek olarak burada da bir güncelleme yapmak yedeklilik sağlar.
            const { error: updateError } = await supabase
              .from('profiles')
              .upsert({
                id: userId, // Supabase'de user.id'yi kullan
                subscription_status: 'premium', // Sabit premium değeri kullan
                subscription_plan: plan,
                subscription_start_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (updateError) {
              console.error('Abonelik güncelleme hatası (verify-payment):', updateError)
            }

            const successUrl = new URL('/payment/status', siteUrl);
            successUrl.searchParams.set('status', 'success');
            const planName = itemId.includes('_') ? itemId.split('_')[0].charAt(0).toUpperCase() + itemId.split('_')[0].slice(1) + ' Plan' : 'Pro Plan';
            successUrl.searchParams.set('plan', planName);
            successUrl.searchParams.set('amount', result.paidPrice);
            resolve(NextResponse.redirect(successUrl, { status: 303 }));

          } catch (dbError) {
            console.error('Database error:', dbError)
            const failureUrl = new URL('/payment/status', siteUrl);
            failureUrl.searchParams.set('status', 'failure');
            failureUrl.searchParams.set('error', 'Ödeme sonrası veritabanı güncelleme hatası.');
            resolve(NextResponse.redirect(failureUrl, { status: 303 }));
          }
        } else {
          const failureUrl = new URL('/payment/status', siteUrl);
          failureUrl.searchParams.set('status', 'failure');
          failureUrl.searchParams.set('error', result?.errorMessage || 'Ödeme durumu belirsiz.');
          resolve(NextResponse.redirect(failureUrl, { status: 303 }));
        }
      })
    })

  } catch (error) {
    console.error('Ödeme doğrulama genel hatası:', error);
    return NextResponse.redirect(new URL('/payment/status?status=failure&error=Beklenmedik bir hata oluştu.', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), { status: 303 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handlePaymentVerification(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handlePaymentVerification(request);
}
