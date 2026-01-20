// app/api/iyzico/checkout/route.ts
// Credit Package Purchase Flow

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Iyzipay from 'iyzipay';
import { CREDIT_PACKAGES, getPackageById } from '../../../lib/pricing';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Authenticate user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Please sign in to purchase credits.' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    // Get package from request
    const { packageId } = await request.json();

    // Validate package
    const creditPackage = getPackageById(packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid credit package selected.' },
        { status: 400 }
      );
    }

    // Get user profile for name
    const fullName = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    const nameParts = fullName.split(' ');
    const name = nameParts[0];
    const surname = nameParts.slice(1).join(' ') || 'User';

    // Safe registration date formatting
    const registrationDate = new Date(user.created_at);
    const formattedRegistrationDate = (isNaN(registrationDate.getTime()) ? new Date() : registrationDate)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // Initialize Iyzipay
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    });

    // Create unique IDs for this transaction
    const timestamp = Date.now();
    const conversationId = `conv_${user.id.slice(0, 8)}_${timestamp}`;
    const basketId = `basket_${user.id.slice(0, 8)}_${packageId}_${timestamp}`;

    // Build payment request
    const paymentRequest: any = {
      locale: 'en',
      conversationId: conversationId,
      price: creditPackage.priceUsd.toFixed(2),
      paidPrice: creditPackage.priceUsd.toFixed(2),
      currency: 'USD',
      basketId: basketId,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/iyzico/callback`,
      enabledInstallments: ['1'],
      
      buyer: {
        id: user.id,
        name: name,
        surname: surname,
        gsmNumber: '+905555555555',
        email: user.email,
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: formattedRegistrationDate,
        registrationAddress: 'N/A',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      
      shippingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Digital Product - No Shipping',
        zipCode: '34000'
      },
      
      billingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Digital Product',
        zipCode: '34000'
      },
      
      basketItems: [
        {
          id: packageId,
          name: `${creditPackage.name} - ${creditPackage.totalCredits} Credits`,
          category1: 'Digital Services',
          category2: 'Credits',
          itemType: 'VIRTUAL',
          price: creditPackage.priceUsd.toFixed(2)
        }
      ]
    };

    // Create checkout form
    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutFormInitialize.create(paymentRequest, async (err: any, result: any) => {
        if (err || result.status === 'failure') {
          console.error('Iyzico Error:', err || result.errorMessage);
          resolve(NextResponse.json(
            { error: `Payment initialization failed: ${err?.message || result.errorMessage}` },
            { status: 500 }
          ));
          return;
        }

        // Store pending payment in database
        try {
          await supabase.from('payment_history').insert({
            user_id: user.id,
            payment_id: result.token, // Use token as initial payment_id
            conversation_id: conversationId,
            basket_id: basketId,
            package_id: packageId,
            amount_usd: creditPackage.priceUsd,
            credits_purchased: creditPackage.credits,
            bonus_credits: creditPackage.bonusCredits,
            status: 'pending',
            iyzico_response: result
          });
        } catch (dbError) {
          console.error('DB Error storing pending payment:', dbError);
          // Continue anyway - payment can still complete
        }

        resolve(NextResponse.json({
          success: true,
          url: result.paymentPageUrl,
          token: result.token,
          package: {
            id: packageId,
            name: creditPackage.name,
            credits: creditPackage.totalCredits,
            price: creditPackage.priceUsd
          }
        }));
      });
    });

  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json(
      { error: 'Server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}