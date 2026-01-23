// app/api/iyzico/verify-payment/route.ts
// Fallback Payment Verification - Credit System
// Bu route, callback başarısız olursa yedek olarak kredi ekler

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Iyzipay from 'iyzipay'
import { CREDIT_PACKAGES } from '../../../lib/pricing'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
          // Ödeme başarılı - Kredi ekle (callback'in yedek versiyonu)
          try {
            console.log('[VERIFY-PAYMENT] Ödeme doğrulama başarılı');
            const basketId = result.basketId;
            // basketId format: basket_<userId8>_<packageId>_<timestamp>
            const basketParts = basketId.split('_');
            const packageId = basketParts[2];

            console.log('[VERIFY-PAYMENT] Bilgiler:', {
              packageId,
              basketId,
              paymentId: result.paymentId,
              conversationId: result.conversationId
            });

            // Kredi paketi kontrolü
            const creditPackage = CREDIT_PACKAGES[packageId];
            if (!creditPackage) {
              console.error('[VERIFY-PAYMENT] Geçersiz paket ID:', packageId);
              const failureUrl = new URL('/payment/status', siteUrl);
              failureUrl.searchParams.set('status', 'failure');
              failureUrl.searchParams.set('error', 'Geçersiz kredi paketi.');
              resolve(NextResponse.redirect(failureUrl, { status: 303 }));
              return;
            }

            const supabase = getSupabaseAdmin();

            // FIXED: Get user_id directly from payment_history (stored during checkout)
            // This avoids UUID collision risk from parsing basketId
            const { data: pendingPayment, error: pendingError } = await supabase
              .from('payment_history')
              .select('id, user_id, status, payment_id')
              .or(`payment_id.eq.${token},conversation_id.eq.${result.conversationId}`)
              .limit(1)
              .single();

            if (pendingError || !pendingPayment) {
              console.error('[VERIFY-PAYMENT] Ödeme kaydı bulunamadı:', { token, conversationId: result.conversationId });
              const failureUrl = new URL('/payment/status', siteUrl);
              failureUrl.searchParams.set('status', 'failure');
              failureUrl.searchParams.set('error', 'Ödeme kaydı bulunamadı.');
              resolve(NextResponse.redirect(failureUrl, { status: 303 }));
              return;
            }

            const fullUserId = pendingPayment.user_id;

            // Daha önce işlenmiş mi kontrol et (idempotency)
            if (pendingPayment.status === 'success') {
              console.log('[VERIFY-PAYMENT] Bu ödeme zaten işlenmiş:', result.paymentId);

              // FIXED: Verify credits were actually added by checking credit_transactions
              const { data: creditTx } = await supabase
                .from('credit_transactions')
                .select('id')
                .eq('payment_id', result.paymentId)
                .limit(1);

              if (!creditTx || creditTx.length === 0) {
                // Payment marked success but credits not added - need to add credits
                console.warn('[VERIFY-PAYMENT] Ödeme başarılı işaretli ama kredi eksik, tekrar deneniyor...');
              } else {
                // Zaten işlenmişse başarı sayfasına yönlendir
                const successUrl = new URL('/payment/status', siteUrl);
                successUrl.searchParams.set('status', 'success');
                successUrl.searchParams.set('package', creditPackage.name);
                successUrl.searchParams.set('credits', creditPackage.totalCredits.toString());
                successUrl.searchParams.set('already_processed', 'true');
                resolve(NextResponse.redirect(successUrl, { status: 303 }));
                return;
              }
            }

            // Kredi ekle (RPC fonksiyonu ile)
            const { data: creditResult, error: creditError } = await supabase.rpc('add_credits', {
              p_user_id: fullUserId,
              p_amount: creditPackage.credits,
              p_bonus: creditPackage.bonusCredits,
              p_payment_id: result.paymentId,
              p_package_id: packageId
            });

            if (creditError) {
              console.error('[VERIFY-PAYMENT] Kredi ekleme hatası:', creditError);
              const failureUrl = new URL('/payment/status', siteUrl);
              failureUrl.searchParams.set('status', 'failure');
              failureUrl.searchParams.set('error', 'Kredi eklenemedi.');
              resolve(NextResponse.redirect(failureUrl, { status: 303 }));
              return;
            }

            const addResult = creditResult?.[0];
            console.log('[VERIFY-PAYMENT] Kredi başarıyla eklendi:', {
              userId: fullUserId,
              credits: creditPackage.credits,
              bonus: creditPackage.bonusCredits,
              newBalance: addResult?.new_balance
            });

            // Update payment history with success and real paymentId
            await supabase
              .from('payment_history')
              .update({
                payment_id: result.paymentId, // Update to real Iyzico paymentId
                status: 'success',
                iyzico_response: result,
                completed_at: new Date().toISOString()
              })
              .or(`payment_id.eq.${token},conversation_id.eq.${result.conversationId}`);

            const successUrl = new URL('/payment/status', siteUrl);
            successUrl.searchParams.set('status', 'success');
            successUrl.searchParams.set('package', creditPackage.name);
            successUrl.searchParams.set('credits', creditPackage.totalCredits.toString());
            successUrl.searchParams.set('balance', addResult?.new_balance?.toString() || '0');
            resolve(NextResponse.redirect(successUrl, { status: 303 }));

          } catch (dbError) {
            console.error('[VERIFY-PAYMENT] Veritabanı hatası:', dbError);
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
