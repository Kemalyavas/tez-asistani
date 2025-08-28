import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Basit payment implementation - production'da Iyzico kullanın
export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();
      
    
    const paymentData = {
      locale: 'tr',
      conversationId: crypto.randomBytes(16).toString('hex'),
      price: plan === 'monthly' ? '49' : '399',
      paidPrice: plan === 'monthly' ? '49' : '399',
      currency: 'TRY',
      basketId: 'B' + Date.now(),
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      buyer: {
        id: 'BY' + Date.now(),
        name: 'Test',
        surname: 'User',
        email: email,
        identityNumber: '11111111111',
        address: 'Test Address',
        city: 'Istanbul',
        country: 'Turkey',
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    };

    // Simulated payment response
    const paymentResponse = {
      status: 'success',
      paymentId: crypto.randomBytes(16).toString('hex'),
      checkoutFormContent: '<form>Payment form would be here</form>',
      paymentPageUrl: 'https://payment-gateway.com/checkout'
    };

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi başarısız' },
      { status: 500 }
    );
  }
}