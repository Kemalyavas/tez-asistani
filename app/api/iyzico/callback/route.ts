// app/api/iyzico/callback/route.ts
// Credit Purchase Payment Callback Handler

import { NextRequest, NextResponse } from 'next/server';
import Iyzipay from 'iyzipay';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_PACKAGES } from '../../../lib/pricing';

export const dynamic = 'force-dynamic';

// Initialize Supabase with service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET request handler - for direct URL visits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      console.error('[ERROR] Token not found (GET)');
      return NextResponse.redirect(
        new URL('/payment/fail?error=missing_token', request.nextUrl),
        { status: 303 }
      );
    }

    return verifyAndProcessPayment(token, request);
  } catch (error: any) {
    console.error('[CRITICAL ERROR] GET:', error.message);
    return NextResponse.redirect(
      new URL('/payment/fail?error=server_error', request.nextUrl),
      { status: 303 }
    );
  }
}

// POST request handler - Iyzico callback
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get('token');

    if (!token) {
      console.error('[ERROR] Iyzico did not send token');
      return NextResponse.redirect(
        new URL('/payment/fail?error=missing_token', request.nextUrl),
        { status: 303 }
      );
    }

    return verifyAndProcessPayment(token, request);
  } catch (error: any) {
    console.error('[CRITICAL ERROR] POST:', error.message);
    return NextResponse.redirect(
      new URL('/payment/fail?error=server_error', request.nextUrl),
      { status: 303 }
    );
  }
}

// Main verification and credit addition function
async function verifyAndProcessPayment(token: string, request: NextRequest) {
  const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL!
  });

  try {
    // Retrieve payment details from Iyzico
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err, res) => {
        if (err) {
          console.error('[IYZICO ERROR]', err);
          return reject(err);
        }
        resolve(res);
      });
    });

    console.log('[IYZICO RESULT]', {
      status: result.status,
      paymentStatus: result.paymentStatus,
      basketId: result.basketId,
      paymentId: result.paymentId
    });

    // Check if payment was successful
    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      const errorMessage = encodeURIComponent(result.errorMessage || 'payment_failed');
      
      // Update payment history with failure
      await updatePaymentStatus(token, 'failed', result);
      
      return NextResponse.redirect(
        new URL(`/payment/fail?error=${errorMessage}`, request.nextUrl),
        { status: 303 }
      );
    }

    // Payment successful - extract details from basketId for package info
    const basketId = result.basketId || '';
    const basketParts = basketId.split('_');
    // basketId format: basket_<userId8>_<packageId>_<timestamp>
    const packageId = basketParts[2];

    console.log('[PAYMENT SUCCESS]', {
      basketId,
      packageId,
      paymentId: result.paymentId,
      conversationId: result.conversationId
    });

    // Get credit package details
    const creditPackage = CREDIT_PACKAGES[packageId];
    if (!creditPackage) {
      console.error('[ERROR] Invalid package ID:', packageId);
      return NextResponse.redirect(
        new URL('/payment/fail?error=invalid_package', request.nextUrl),
        { status: 303 }
      );
    }

    const supabase = getSupabaseAdmin();

    // FIXED: Get user_id directly from payment_history (stored during checkout)
    // This avoids UUID collision risk from parsing basketId
    const { data: pendingPayment, error: pendingError } = await supabase
      .from('payment_history')
      .select('id, user_id, status, payment_id')
      .or(`payment_id.eq.${token},conversation_id.eq.${result.conversationId}`)
      .limit(1)
      .single();

    if (pendingError || !pendingPayment) {
      console.error('[ERROR] Payment record not found:', { token, conversationId: result.conversationId });
      return NextResponse.redirect(
        new URL('/payment/fail?error=payment_not_found', request.nextUrl),
        { status: 303 }
      );
    }

    const fullUserId = pendingPayment.user_id;

    // Idempotency check - prevent double credit addition
    if (pendingPayment.status === 'success') {
      console.log('[CALLBACK] Payment already processed:', result.paymentId);

      // FIXED: Verify credits were actually added by checking credit_transactions
      const { data: creditTx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('payment_id', result.paymentId)
        .limit(1);

      if (!creditTx || creditTx.length === 0) {
        // Payment marked success but credits not added - need to add credits
        console.warn('[CALLBACK] Payment marked success but credits missing, retrying...');
      } else {
        // Already processed with credits - redirect to success
        const successParams = new URLSearchParams({
          package: packageId,
          credits: creditPackage.totalCredits.toString(),
          already_processed: 'true'
        });
        return NextResponse.redirect(
          new URL(`/payment/success?${successParams.toString()}`, request.nextUrl),
          { status: 303 }
        );
      }
    }

    // Add credits to user account using database function
    const { data: creditResult, error: creditError } = await supabase.rpc('add_credits', {
      p_user_id: fullUserId,
      p_amount: creditPackage.credits,
      p_bonus: creditPackage.bonusCredits,
      p_payment_id: result.paymentId,
      p_package_id: packageId
    });

    if (creditError) {
      console.error('[CREDIT ERROR]', creditError);
      return NextResponse.redirect(
        new URL('/payment/fail?error=credit_add_failed', request.nextUrl),
        { status: 303 }
      );
    }

    const addResult = creditResult?.[0];
    console.log('[CREDITS ADDED]', {
      userId: fullUserId,
      credits: creditPackage.credits,
      bonus: creditPackage.bonusCredits,
      newBalance: addResult?.new_balance
    });

    // Update payment history with success
    // First try to match by token (initial payment_id), then update with real paymentId
    const { error: updateError } = await supabase
      .from('payment_history')
      .update({
        payment_id: result.paymentId, // Update to real Iyzico paymentId for consistency
        status: 'success',
        iyzico_response: result,
        completed_at: new Date().toISOString()
      })
      .or(`payment_id.eq.${token},conversation_id.eq.${result.conversationId}`);

    if (updateError) {
      console.warn('[CALLBACK] Could not update payment_history:', updateError);
      // Continue anyway - credits were added successfully
    }

    // Redirect to success page with details
    const successParams = new URLSearchParams({
      package: packageId,
      credits: creditPackage.totalCredits.toString(),
      balance: addResult?.new_balance?.toString() || '0'
    });

    return NextResponse.redirect(
      new URL(`/payment/success?${successParams.toString()}`, request.nextUrl),
      { status: 303 }
    );

  } catch (error: any) {
    console.error('[VERIFICATION ERROR]', error.message);
    return NextResponse.redirect(
      new URL('/payment/fail?error=verification_failed', request.nextUrl),
      { status: 303 }
    );
  }
}

// Helper function to update payment status
async function updatePaymentStatus(token: string, status: string, result: any) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('payment_history')
      .update({
        status,
        iyzico_response: result,
        error_message: result.errorMessage
      })
      .eq('payment_id', token);
  } catch (error) {
    console.error('[DB ERROR] Failed to update payment status:', error);
  }
}