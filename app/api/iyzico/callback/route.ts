// app/api/iyzico/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Iyzipay from 'iyzipay';

// Service role client kullan (RLS bypass için)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// Hem GET hem POST destekle
export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  try {
    console.log('[CALLBACK] İstek alındı');
    console.log('[CALLBACK] Method:', request.method);
    console.log('[CALLBACK] URL:', request.url);

    let token: string | null = null;

    // Token'ı al - hem GET hem POST için
    if (request.method === 'POST') {
      // POST isteği - form data olarak gelir
      const formData = await request.formData();
      token = formData.get('token') as string;
      
      if (!token) {
        // Body'den almayı dene
        const bodyText = await request.text();
        const params = new URLSearchParams(bodyText);
        token = params.get('token');
      }
    } else {
      // GET isteği - query params olarak gelir
      const { searchParams } = new URL(request.url);
      token = searchParams.get('token');
    }

    console.log('[CALLBACK] Token:', token ? `${token.substring(0, 10)}...` : 'YOK');

    if (!token) {
      console.error('[CALLBACK-HATA] Token bulunamadı');
      return NextResponse.redirect(
        new URL('/payment/fail?error=token_yok', request.nextUrl.origin)
      );
    }

    // Iyzico instance
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });

    // Token ile ödeme sonucunu sorgula
    console.log('[CALLBACK] Iyzico sorgusu başlatılıyor...');
    
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { 
          locale: Iyzipay.LOCALE.TR,
          token: token 
        }, 
        (err: any, res: any) => {
          if (err) {
            console.error('[CALLBACK-IYZICO-ERROR]', err);
            return reject(err);
          }
          console.log('[CALLBACK-IYZICO-RESPONSE]', {
            status: res.status,
            paymentStatus: res.paymentStatus,
            conversationId: res.conversationId,
            errorCode: res.errorCode,
            errorMessage: res.errorMessage
          });
          resolve(res);
        }
      );
    });

    // Sonuç kontrolü
    if (result.status !== 'success') {
      console.error('[CALLBACK-PAYMENT-FAILED]', result);
      
      // Transaction'ı failed olarak güncelle
      if (result.conversationId) {
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'failed',
            payment_status: result.paymentStatus,
            error_message: result.errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('conversation_id', result.conversationId);
      }

      const errorMessage = encodeURIComponent(
        result.errorMessage || 'Ödeme başarısız'
      );
      return NextResponse.redirect(
        new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl.origin)
      );
    }

    // Ödeme başarılı
    if (result.paymentStatus === 'SUCCESS') {
      const { conversationId, paymentId, basketItems, paidPrice } = result;
      
      // Conversation ID'den user ID'yi çıkar
      const userId = conversationId?.split('_')[1];
      
      // Basket item'dan plan bilgisini al
      const basketItem = basketItems?.[0];
      const planInfo = basketItem?.id?.split('_'); // örn: ['pro', 'monthly']
      const planId = planInfo?.[0];
      const billingCycle = planInfo?.[1] || 'monthly';

      console.log('[CALLBACK-SUCCESS]', {
        userId,
        planId,
        billingCycle,
        paymentId,
        paidPrice
      });

      if (userId && planId) {
        try {
          // Transaction'ı güncelle
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'completed',
              payment_status: 'SUCCESS',
              payment_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId);

          // Kullanıcı profilini güncelle
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: planId,
              subscription_plan: `${planId}_${billingCycle}`,
              subscription_start_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              // Limitleri sıfırla (yeni ay/yıl için)
              thesis_count: 0,
              abstract_count: 0,
              citation_count: 0
            })
            .eq('id', userId);

          if (profileError) {
            console.error('[CALLBACK-PROFILE-ERROR]', profileError);
            // Kritik değil, devam et
          }

          console.log('[CALLBACK] Kullanıcı profili güncellendi:', userId);
          
        } catch (dbError) {
          console.error('[CALLBACK-DB-ERROR]', dbError);
          // Ödeme başarılı ama DB güncellenemedi
          // Yine de success'e yönlendir, manuel düzeltme gerekebilir
        }
      }

      // Başarı sayfasına yönlendir
      return NextResponse.redirect(
        new URL('/payment/success', request.nextUrl.origin)
      );
      
    } else {
      // Ödeme durumu belirsiz
      console.error('[CALLBACK-UNKNOWN-STATUS]', result);
      return NextResponse.redirect(
        new URL('/payment/fail?error=belirsiz_durum', request.nextUrl.origin)
      );
    }

  } catch (error: any) {
    console.error('[CALLBACK-CRITICAL-ERROR]', error);
    
    // Hata sayfasına yönlendir
    return NextResponse.redirect(
      new URL('/payment/fail?error=sunucu_hatasi', request.nextUrl.origin)
    );
  }
}