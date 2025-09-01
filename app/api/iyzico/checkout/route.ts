// app/api/iyzico/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';

export const dynamic = 'force-dynamic';

// Plan fiyatları
const PLAN_PRICES = {
  pro: {
    monthly: 2, // Test için düşük fiyat
    yearly: 1990
  },
  expert: {
    monthly: 499,
    yearly: 4990
  }
};

export async function POST(request: NextRequest) {
  try {
    // 1. Request body'yi al
    const body = await request.json();
    const { plan, billing_cycle = 'monthly' } = body;

    // 2. Plan kontrolü
    if (!plan || !['pro', 'expert'].includes(plan)) {
      return NextResponse.json(
        { error: 'Geçersiz plan seçimi' },
        { status: 400 }
      );
    }

    // 3. Kullanıcı kontrolü
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // 4. Kullanıcı bilgilerini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 5. Fiyat hesaplama
    const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES][billing_cycle as 'monthly' | 'yearly'];
    const planName = plan === 'pro' ? 'Pro Plan' : 'Expert Plan';
    const periodText = billing_cycle === 'yearly' ? 'Yıllık' : 'Aylık';

    // 6. Iyzico instance'ı oluştur
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });

    // 7. Checkout form request'i hazırla
    const checkoutRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `tezai_${user.id}_${Date.now()}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `B${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
      callbackUrl: `${request.nextUrl.origin}/api/iyzico/callback`,
      enabledInstallments: [1], // Tek çekim
      buyer: {
        id: user.id,
        name: profile?.full_name || profile?.username || 'İsimsiz',
        surname: 'Kullanıcı',
        gsmNumber: profile?.phone || '+905555555555',
        email: user.email!,
        identityNumber: '11111111111', // Test için
        lastLoginDate: new Date().toISOString().split('T')[0],
        registrationDate: new Date(user.created_at).toISOString().split('T')[0],
        registrationAddress: 'Türkiye',
        ip: request.headers.get('x-forwarded-for') || '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732'
      },
      shippingAddress: {
        contactName: profile?.full_name || profile?.username || 'İsimsiz Kullanıcı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732'
      },
      billingAddress: {
        contactName: profile?.full_name || profile?.username || 'İsimsiz Kullanıcı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732'
      },
      basketItems: [
        {
          id: `${plan}_${billing_cycle}`,
          name: `${planName} - ${periodText}`,
          category1: 'Abonelik',
          category2: plan.toUpperCase(),
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: price.toString()
        }
      ]
    };

    console.log('[CHECKOUT] İstek hazırlandı:', {
      user: user.email,
      plan,
      billing_cycle,
      price,
      conversationId: checkoutRequest.conversationId
    });

    // 8. Iyzico'ya istek gönder
    const checkoutFormResult = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(checkoutRequest as any, (err: any, result: any) => {
        if (err) {
          console.error('[CHECKOUT-ERROR]', err);
          return reject(err);
        }
        resolve(result);
      });
    });

    console.log('[CHECKOUT-RESPONSE]', {
      status: checkoutFormResult.status,
      errorCode: checkoutFormResult.errorCode,
      errorMessage: checkoutFormResult.errorMessage,
      token: checkoutFormResult.token ? 'exists' : 'missing',
      checkoutFormContent: checkoutFormResult.checkoutFormContent ? 'exists' : 'missing'
    });

    // 9. Sonuç kontrolü
    if (checkoutFormResult.status !== 'success') {
      console.error('[CHECKOUT-FAIL]', checkoutFormResult);
      return NextResponse.json(
        { 
          error: checkoutFormResult.errorMessage || 'Ödeme formu oluşturulamadı',
          errorCode: checkoutFormResult.errorCode,
          details: checkoutFormResult.errorGroup
        },
        { status: 400 }
      );
    }

    // 10. Token ve pageUrl kontrolü
    if (!checkoutFormResult.token || !checkoutFormResult.paymentPageUrl) {
      console.error('[CHECKOUT-INVALID]', 'Token veya URL eksik');
      return NextResponse.json(
        { error: 'Ödeme sayfası oluşturulamadı' },
        { status: 500 }
      );
    }

    // 11. Transaction'ı veritabanına kaydet (opsiyonel)
    try {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          iyzico_token: checkoutFormResult.token,
          conversation_id: checkoutRequest.conversationId,
          plan_id: plan,
          billing_cycle,
          amount: price,
          status: 'pending',
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.warn('[DB-WARNING] Transaction kaydedilemedi:', dbError);
      // Kritik değil, devam et
    }

    // 12. Başarılı response
    return NextResponse.json({
      success: true,
      token: checkoutFormResult.token,
      url: checkoutFormResult.paymentPageUrl,
      checkoutFormContent: checkoutFormResult.checkoutFormContent
    });

  } catch (error: any) {
    console.error('[CHECKOUT-CRITICAL-ERROR]', error);
    
    // Detaylı hata mesajları
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Ödeme sistemi yapılandırma hatası. Lütfen destek ile iletişime geçin.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('Network')) {
      return NextResponse.json(
        { error: 'Ödeme sistemi bağlantı hatası. Lütfen tekrar deneyin.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Ödeme işlemi başlatılamadı',
        message: error.message || 'Bilinmeyen hata',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}