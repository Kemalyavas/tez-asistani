// app/api/iyzico/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    console.log('🔔 Webhook received:', {
      eventType: body.iyziEventType,
      paymentStatus: body.paymentStatus,
      timestamp: new Date().toISOString()
    });

    // ⚠️ GEÇİCİ: İmza kontrolünü devre dışı bırak (production'da açılmalı)
    const SKIP_SIGNATURE = true;
    
    if (!SKIP_SIGNATURE) {
      const signature = request.headers.get('x-iyzi-signature');
      const secretKey = process.env.IYZICO_SECRET_KEY;
      
      if (!signature || !secretKey) {
        console.error('❌ Missing signature or secret key');
        return NextResponse.json({ 
          error: 'Yapılandırma hatası: İmza veya anahtar eksik' 
        }, { status: 401 });
      }
      
      // İmza doğrulama kodu buraya gelecek...
    }

    // Test webhook'u
    if (body.test === true) {
      console.log('✅ Test webhook başarılı!');
      return NextResponse.json({ 
        status: 'success',
        message: 'Test webhook received successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Gerçek ödeme webhook'u
    if (body.iyziEventType === 'SUCCESS_PAYMENT' && body.paymentStatus === 'SUCCESS') {
      console.log('💰 Payment success webhook received');
      
      const conversationId = body.conversationId;
      const paymentDetails = body.paymentConversationData;
      
      if (!conversationId || !paymentDetails) {
        console.error('❌ Missing payment details');
        return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
      }

      try {
        const userId = conversationId.split('_')[1];
        const planId = paymentDetails.basketItems?.[0]?.id;
        
        if (userId && planId) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_plan: planId,
              subscription_start_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Database update error:', updateError);
          } else {
            console.log('✅ User subscription updated:', userId);
          }
        }
      } catch (error) {
        console.error('❌ Processing error:', error);
      }
    }

    // Her durumda 200 OK dön (İyzico bunu bekler)
    return NextResponse.json({ 
      status: 'ok',
      received: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}

// GET metodunu da ekle (bazı webhook sistemleri GET ile health check yapar)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/iyzico/webhook',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}