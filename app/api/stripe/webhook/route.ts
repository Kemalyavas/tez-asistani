import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Stripe signature eksik' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Webhook signature doğrulanamadı' },
        { status: 400 }
      )
    }

    // Webhook event işleme
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook işlemi başarısız: ' + error.message },
      { status: 500 }
    )
  }
}

// Checkout tamamlandığında
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan

  if (!userId || !plan) {
    console.error('Metadata eksik:', { userId, plan })
    return
  }

  // Kullanıcının üyelik tipini güncelle
  const { error } = await supabase
    .from('users')
    .update({
      membership_type: plan,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Kullanıcı güncelleme hatası:', error)
  } else {
    console.log(`Kullanıcı ${userId} ${plan} planına yükseltildi`)
  }
}

// Abonelik güncellendiğinde
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('User ID bulunamadı subscription metadata\'da')
    return
  }

  let membershipType = 'free'
  
  // Aktif abonelik varsa plan tipini belirle
  if (subscription.status === 'active') {
    const priceId = subscription.items.data[0]?.price.id
    
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      membershipType = 'pro'
    } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
      membershipType = 'enterprise'
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      membership_type: membershipType,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Abonelik güncelleme hatası:', error)
  }
}

// Abonelik iptal edildiğinde
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('User ID bulunamadı subscription metadata\'da')
    return
  }

  const { error } = await supabase
    .from('users')
    .update({
      membership_type: 'free',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Abonelik iptal güncelleme hatası:', error)
  } else {
    console.log(`Kullanıcı ${userId} free plana düşürüldü`)
  }
}

// Ödeme başarılı olduğunda
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Ödeme başarılı:', invoice.id)
  // İsteğe bağlı: Email gönder, analytics kaydet vb.
}

// Ödeme başarısız olduğunda
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Ödeme başarısız:', invoice.id)
  // İsteğe bağlı: Kullanıcıyı bilgilendir, retry logic vb.
}
