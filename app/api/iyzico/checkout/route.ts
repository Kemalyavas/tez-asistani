import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// TL fiyatları (İyzico TL destekliyor)
const PRICING_PLANS = {
  pro: {
    amount: 399, // 399 TL/ay
    currency: 'TRY',
    name: 'Pro Plan',
    features: [
      '50 tez analizi',
      '20 özet oluşturma', 
      '100 kaynak formatlama',
      'Gelişmiş AI modelleri',
      'Hızlı e-posta desteği',
      'Detaylı kullanım raporları',
      'Çoklu format desteği (APA, MLA, Chicago, IEEE)'
    ]
  },
  expert: {
    amount: 950, // 950 TL/ay
    currency: 'TRY', 
    name: 'Expert Plan',
    features: [
      'Sınırsız tez analizi',
      'Sınırsız özet oluşturma',
      'Sınırsız kaynak formatlama',
      'En gelişmiş AI modelleri',
      'Türkçe ve İngilizce özet desteği',
      '7/24 öncelikli destek',
      'Özel kullanıcı yönetimi',
      'Detaylı analitik raporlar'
    ]
  }
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

    const { plan, user_id } = await request.json()

    if (!plan || !user_id || !PRICING_PLANS[plan as keyof typeof PRICING_PLANS]) {
      return NextResponse.json(
        { error: 'Geçersiz plan veya kullanıcı ID' },
        { status: 400 }
      )
    }

    const selectedPlan = PRICING_PLANS[plan as keyof typeof PRICING_PLANS]

    // Kullanıcı bilgilerini al
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
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
      price: selectedPlan.amount.toString(),
      paidPrice: selectedPlan.amount.toString(),
      currency: selectedPlan.currency,
      installment: '1',
      basketId: `basket_${user_id}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/success`,
      enabledInstallments: ['1'],
      buyer: {
        id: user_id,
        name: userData.full_name?.split(' ')[0] || 'Ad',
        surname: userData.full_name?.split(' ')[1] || 'Soyad',
        gsmNumber: userData.phone || '+905555555555',
        email: userData.email,
        identityNumber: '11111111111', // Test için
        lastLoginDate: new Date().toISOString().slice(0, 19),
        registrationDate: userData.created_at?.slice(0, 19) || new Date().toISOString().slice(0, 19),
        registrationAddress: 'Test Adres',
        ip: request.ip || '127.0.0.1',
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
          id: plan,
          name: selectedPlan.name,
          category1: 'Software',
          category2: 'Subscription',
          itemType: 'VIRTUAL',
          price: selectedPlan.amount.toString()
        }
      ]
    }

    return new Promise<NextResponse>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(request_data, (err: any, result: any) => {
        if (err) {
          console.error('İyzico error:', err)
          resolve(NextResponse.json(
            { error: 'Ödeme işlemi başlatılamadı' },
            { status: 500 }
          ))
        } else {
          resolve(NextResponse.json({
            success: true,
            url: result.paymentPageUrl,
            token: result.token
          }))
        }
      })
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
