import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Iyzipay from 'iyzipay'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Bu fonksiyon hem GET hem de POST isteklerini işler.
 * Iyzico'dan gelen POST isteğini yakalar ve kullanıcıyı bir sonuç sayfasına yönlendirir.
 * Kullanıcı sayfayı yenilerse (GET) veya URL'yi kopyalarsa da çalışır.
 */
async function handlePaymentVerification(request: NextRequest) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    })

    const { searchParams } = new URL(request.url)
    // Iyzico hem POST body'sinde hem de bazen URL'de token gönderebilir.
    // Önce body'yi, sonra URL'yi kontrol etmek en güvenlisidir.
    const formData = await request.clone().formData().catch(() => null);
    const token = formData?.get('token') as string || searchParams.get('token');

    if (!token) {
      const failureUrl = new URL('/payment/status', siteUrl);
      failureUrl.searchParams.set('status', 'failure');
      failureUrl.searchParams.set('error', 'Ödeme token bilgisi bulunamadı.');
      return NextResponse.redirect(failureUrl);
    }

    return new Promise<NextResponse>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, async (err: any, result: any) => {
        console.log('Iyzico retrieve result:', result)
        console.log('Error:', err)
        if (err) {
          console.error('Iyzico retrieve error:', err);
          const failureUrl = new URL('/payment/status', siteUrl);
          failureUrl.searchParams.set('status', 'failure');
          failureUrl.searchParams.set('error', 'Ödeme sağlayıcısı ile doğrulama başarısız oldu.');
          resolve(NextResponse.redirect(failureUrl));
        } else if (result.status === 'success') {
          // Ödeme başarılı. Webhook zaten asıl güncellemeyi yapıyor.
          // Burası kullanıcıyı bilgilendirme ve yönlendirme amaçlı.
          try {
            const basketId = result.basketId
            const userId = basketId.split('_')[1]
            const itemId = result.itemTransactions[0].itemId
            const plan = itemId.split('_')[0]
            
            // Webhook'a ek olarak burada da bir güncelleme yapmak yedeklilik sağlar.
            const { error: updateError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                subscription_status: 'premium',
                subscription_plan: itemId,
                subscription_start_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (updateError) {
              console.error('Subscription update error:', updateError)
            }

            const successUrl = new URL('/payment/status', siteUrl);
            successUrl.searchParams.set('status', 'success');
            successUrl.searchParams.set('plan', 'Pro Plan'); // Bu bilgiyi basketId'den daha dinamik alabilirsiniz.
            successUrl.searchParams.set('amount', result.paidPrice);
            resolve(NextResponse.redirect(successUrl));

          } catch (dbError) {
            console.error('Database error:', dbError)
            const failureUrl = new URL('/payment/status', siteUrl);
            failureUrl.searchParams.set('status', 'failure');
            failureUrl.searchParams.set('error', 'Ödeme sonrası veritabanı güncelleme hatası.');
            resolve(NextResponse.redirect(failureUrl));
          }
        } else {
          const failureUrl = new URL('/payment/status', siteUrl);
          failureUrl.searchParams.set('status', 'failure');
          failureUrl.searchParams.set('error', result.errorMessage || 'Ödeme başarısız oldu.');
          resolve(NextResponse.redirect(failureUrl));
        }
      })
    })

  } catch (error) {
    console.error('Verify payment error:', error)
    const failureUrl = new URL('/payment/status', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    failureUrl.searchParams.set('status', 'failure');
    failureUrl.searchParams.set('error', 'Ödeme doğrulama sırasında beklenmedik bir sunucu hatası oluştu.');
    return NextResponse.redirect(failureUrl);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handlePaymentVerification(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handlePaymentVerification(request);
}
