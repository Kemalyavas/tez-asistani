import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// USD fiyatları (resimdeki gibi)
const PRICING_PLANS = {
  pro: {
    price_id: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 10, // $10/ay
    currency: 'usd',
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
  enterprise: {
    price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    amount: 25, // $25/ay
    currency: 'usd', 
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

export async function POST(request: NextRequest) {
  try {
    const { plan, user_id } = await request.json()

    if (!plan || !user_id || !PRICING_PLANS[plan as keyof typeof PRICING_PLANS]) {
      return NextResponse.json(
        { error: 'Geçersiz plan veya kullanıcı ID' },
        { status: 400 }
      )
    }

    const selectedPlan = PRICING_PLANS[plan as keyof typeof PRICING_PLANS]

    // Kullanıcı bilgilerini al
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Stripe checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPlan.price_id,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: user_id,
      metadata: {
        user_id,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      locale: 'tr', // Türkçe arayüz
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: false, // USD için vergi hesaplaması kapalı
      },
      subscription_data: {
        metadata: {
          user_id,
          plan,
        },
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Ödeme işlemi başlatılamadı: ' + error.message },
      { status: 500 }
    )
  }
}
