// app/api/iyzico/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fiyatları tek bir yerden yönetmek için
const PLANS = {
  pro: { monthly: 199, yearly: 1990 }, // Yıllık fiyatı ekledik
  expert: { monthly: 499, yearly: 4990 } // Yıllık fiyatı ekledik
}

const PLAN_NAMES = {
  pro: 'Pro Plan',
  expert: 'Expert Plan'
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Dynamic import İyzico SDK
    const Iyzipay = (await import('iyzipay')).default
    
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    })

    const { plan, user_id, billing_cycle } = await request.json()

    // Gelen plan ve billing_cycle geçerli mi kontrol et
    if (!plan || !user_id || !PLANS[plan as keyof typeof PLANS] || !['monthly', 'yearly'].includes(billing_cycle)) {
      return NextResponse.json(
        { error: 'Geçersiz plan, kullanıcı ID veya ödeme periyodu' },
        { status: 400 }
      )
    }

    // Doğru fiyatı seç
    const price = PLANS[plan as keyof typeof PLANS][billing_cycle as keyof typeof PLANS['pro']];
    const planName = PLAN_NAMES[plan as keyof typeof PLAN_NAMES];

    // Kullanıcı bilgilerini al
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // İyzico ödeme isteği
    const request_data: any = {
      locale: 'tr',
      conversationId: `conv_${user_id}_${Date.now()}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: 'TRY',
      installment: '1',
      basketId: `basket_${user_id}_${plan}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`, // .env'den gelen site adresi
      enabledInstallments: ['1'],
      buyer: {
        id: user_id,
        name: userData.full_name?.split(' ')[0] || 'Ad',
        surname: userData.full_name?.split(' ').slice(1).join(' ') || 'Soyad',
        gsmNumber: '+905555555555', // Placeholder
        email: userData.email,
        identityNumber: '11111111111', // Test için
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date(userData.created_at).toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: 'Test Adres',
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: userData.full_name || 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Test Adres',
        zipCode: '34000'
      },
      billingAddress: {
        contactName: userData.full_name || 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Test Adres',
        zipCode: '34000'
      },
      basketItems: [
        {
          id: `${plan}_${billing_cycle}`,
          name: `${planName} (${billing_cycle === 'yearly' ? 'Yıllık' : 'Aylık'})`,
          category1: 'Software',
          category2: 'Subscription',
          itemType: 'VIRTUAL',
          price: price.toString()
        }
      ]
    }

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutFormInitialize.create(request_data, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          console.error('Iyzico Hatası:', err || result.errorMessage);
          resolve(NextResponse.json(
            { error: `Ödeme sağlayıcı ile iletişim kurulamadı: ${err?.message || result.errorMessage}` },
            { status: 500 }
          ));
        } else {
          resolve(NextResponse.json({
            success: true,
            url: result.paymentPageUrl,
            token: result.token
          }));
        }
      });
    });

  } catch (error) {
    console.error('Checkout API Hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}