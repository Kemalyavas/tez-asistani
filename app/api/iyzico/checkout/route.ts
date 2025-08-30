// app/api/iyzico/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';

// Fiyatları tek bir yerden yönetmek için
const PLANS = {
  pro: { monthly: 199, yearly: 1990 },
  expert: { monthly: 499, yearly: 4990 }
};

const PLAN_NAMES = {
  pro: 'Pro Plan',
  expert: 'Expert Plan'
};

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Geçerli bir oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }
    const user = session.user;

    const { plan, billing_cycle } = await request.json();

    if (!plan || !PLANS[plan as keyof typeof PLANS] || !['monthly', 'yearly'].includes(billing_cycle)) {
      return NextResponse.json({ error: 'Geçersiz plan veya ödeme periyodu' }, { status: 400 });
    }

    const price = PLANS[plan as keyof typeof PLANS][billing_cycle as keyof typeof PLANS['pro']];
    const planName = PLAN_NAMES[plan as keyof typeof PLAN_NAMES];

    // --- HATANIN DÜZELTİLDİĞİ YER ---
    // 'profiles' tablosundan artık 'created_at' istenmiyor, sadece 'full_name' alınıyor.
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name') // Sadece full_name istiyoruz
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Supabase profile error:', profileError);
      // Hata mesajını daha anlaşılır hale getirdik.
      return NextResponse.json({ error: 'Ödeme işlemi için kullanıcı profili bulunamadı. Lütfen destek ile iletişime geçin.' }, { status: 404 });
    }
    // --- HATA DÜZELTİLDİ ---

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    });

    const request_data: any = {
      locale: 'tr',
      conversationId: `conv_${user.id}_${Date.now()}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: 'TRY',
      basketId: `basket_${user.id}_${plan}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      enabledInstallments: ['1'],
      buyer: {
        id: user.id,
        name: profileData.full_name?.split(' ')[0] || 'Ad',
        surname: profileData.full_name?.split(' ').slice(1).join(' ') || 'Soyad',
        gsmNumber: '+905555555555',
        email: user.email,
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        // Kayıt tarihi (registrationDate) doğrudan ana kullanıcı objesinden alınıyor
        registrationDate: new Date(user.created_at).toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: 'Test Adres',
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: profileData.full_name || 'Test User', city: 'Istanbul', country: 'Turkey', address: 'Test Adres', zipCode: '34000'
      },
      billingAddress: {
        contactName: profileData.full_name || 'Test User', city: 'Istanbul', country: 'Turkey', address: 'Test Adres', zipCode: '34000'
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
    };
    
    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutFormInitialize.create(request_data, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          console.error('Iyzico Hatası:', err || result.errorMessage);
          resolve(NextResponse.json({ error: `Ödeme sağlayıcı ile iletişim kurulamadı: ${err?.message || result.errorMessage}` }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true, url: result.paymentPageUrl, token: result.token }));
        }
      });
    });

  } catch (error) {
    console.error('Checkout API Genel Hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}