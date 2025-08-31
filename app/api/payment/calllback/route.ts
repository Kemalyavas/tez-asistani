import { NextRequest, NextResponse } from 'next/server';
import Iyzipay from 'iyzipay';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Payment callback received - POST');
    
    const body = await request.text();
    const params = new URLSearchParams(body);
    const token = params.get('token');
    
    if (!token) {
      console.error('No token in callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=no_token`
      );
    }

    // İyzico'dan ödeme detaylarını al
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    });

    return new Promise((resolve) => {
      iyzipay.checkoutForm.retrieve({
        locale: 'TR',
        token: token
      }, async (err: any, result: any) => {
        if (err || result.status !== 'success') {
          console.error('Payment verification failed:', err || result);
          resolve(NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=payment_failed`
          ));
          return;
        }

        // Ödeme başarılı, veritabanını güncelle
        if (result.paymentStatus === 'SUCCESS') {
          const userId = result.basketId.split('_')[1];
          const plan = result.basketId.split('_')[2];
          
          await supabase
            .from('profiles')
            .update({
              subscription_status: plan,
              subscription_plan: plan,
              subscription_start_date: new Date().toISOString()
            })
            .eq('id', userId);
        }

        resolve(NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?status=completed`
        ));
      });
    });
    
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=callback_error`
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('Payment callback received - GET');
  
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=no_token`
    );
  }
  
  // GET ile gelirse de aynı işlemi yap
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?token=${token}&status=verifying`
  );
}