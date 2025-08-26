import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Dynamic import İyzico SDK
    const Iyzipay = (await import('iyzipay')).default
    
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!
    })

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token bulunamadı' },
        { status: 400 }
      )
    }

    return new Promise<NextResponse>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, async (err: any, result: any) => {
        if (err) {
          console.error('İyzico retrieve error:', err)
          resolve(NextResponse.json(
            { error: 'Ödeme doğrulanamadı' },
            { status: 500 }
          ))
        } else if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
          // Ödeme başarılı - kullanıcı aboneliğini güncelle
          try {
            const conversationId = result.conversationId
            const userId = conversationId.split('_')[1]
            
            // Kullanıcının aboneliğini güncelle
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_plan: result.basketItems[0].id,
                subscription_start_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)

            if (updateError) {
              console.error('Subscription update error:', updateError)
            }

            resolve(NextResponse.json({
              success: true,
              plan_name: result.basketItems[0].name,
              amount: result.paidPrice,
              currency: result.currency,
              payment_id: result.paymentId
            }))
          } catch (dbError) {
            console.error('Database error:', dbError)
            resolve(NextResponse.json(
              { error: 'Veritabanı hatası' },
              { status: 500 }
            ))
          }
        } else {
          resolve(NextResponse.json(
            { error: 'Ödeme başarısız' },
            { status: 400 }
          ))
        }
      })
    })

  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
