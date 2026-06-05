import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../lib/rateLimit';
import { citationAnonRateLimiter } from '../../lib/queue/qstash';
import openai from "../../lib/openai";
import { CREDIT_COSTS } from '../../lib/pricing';
import { isAdmin } from '../../lib/adminUtils';

// Service-role client for privileged refunds
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTION_TYPE = 'citation_format';
const CREDITS_REQUIRED = CREDIT_COSTS[ACTION_TYPE].creditsRequired;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = await rateLimit(`citation_${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 20, // 20 requests per minute
      blockDurationMs: 5 * 60 * 1000 // 5 minutes block
    });

    if (!rateLimitResult.allowed) {
      const waitTime = rateLimitResult.blockedUntil 
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000 / 60)
        : Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
        
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${waitTime} minutes.` },
        { status: 429 }
      );
    }

    const { source, type, format } = await request.json();

    // Validate input
    if (!source || !type || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: source, type, format' },
        { status: 400 }
      );
    }

    // Length cap — kötü niyetli/yanlışlıkla devasa girdiyle AI maliyetini
    // şişirmeyi ve sunucu RAM'ini bozmayı engeller. 5000 karakter tek bir
    // kaynak için fazlasıyla yeterli (uzun bir kitap referansı bile <500).
    if (typeof source !== 'string' || source.length > 5000) {
      return NextResponse.json(
        { error: 'Source is too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    // Supabase auth — ARTIK ZORUNLU DEĞİL. Girişli: kredi düş. Girişsiz: günlük IP kotası.
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const isAnon = !user;

    let userIsAdmin = false;
    let result: any = null;
    let anonRemaining = 0;

    if (isAnon) {
      // Girişsiz ücretsiz deneme: fail-CLOSED günlük IP kotası.
      // Redis erişilemezse denemeyi REDDET (abuse engeli); kayıtlı akış bundan etkilenmez.
      let anonCheck;
      try {
        anonCheck = await citationAnonRateLimiter.limit(`anon_${clientIP}`);
      } catch (e) {
        console.error('[FormatCitation] anon ratelimit error, fail-closed:', e);
        return NextResponse.json(
          { error: 'Ücretsiz deneme şu an kullanılamıyor. Lütfen üye olun.', requireAuth: true },
          { status: 503 }
        );
      }
      if (!anonCheck.success) {
        return NextResponse.json(
          { error: 'Günlük ücretsiz deneme hakkınız doldu. Sınırsız formatlama için üye olun.', requireAuth: true, remainingFree: 0 },
          { status: 429 }
        );
      }
      anonRemaining = anonCheck.remaining;
    } else {
      // Admin bypass - skip credit deduction
      userIsAdmin = isAdmin(user.id);
      if (userIsAdmin) {
        console.log('[ADMIN] Credit check bypassed for user:', user.id);
        result = { success: true, new_balance: 999999 };
      } else {
        // Deduct credits using the database function
        const { data: creditResult, error: creditError } = await supabase.rpc('use_credits', {
          p_user_id: user.id,
          p_amount: CREDITS_REQUIRED,
          p_action_type: ACTION_TYPE,
          p_description: `Format citation: ${format.toUpperCase()} - ${type}`
        });

        if (creditError) {
          console.error('Credit deduction error:', creditError);
          return NextResponse.json(
            { error: 'Failed to process credits' },
            { status: 500 }
          );
        }

        result = creditResult?.[0];
        if (!result?.success) {
          return NextResponse.json(
            {
              error: result?.error_message || 'Insufficient credits',
              creditsRequired: CREDITS_REQUIRED,
              currentCredits: result?.new_balance || 0
            },
            { status: 402 } // Payment Required
          );
        }
      }
    }

    // Process the citation formatting with OpenAI
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `You are an expert academic citation formatter.
Format the given source information according to ${format.toUpperCase()} style guide.

Format rules:
- APA 7: Author, A. A. (Year). Title. Publisher. DOI/URL
- MLA 9: Author. "Title." Publisher, Year.
- Chicago: Author. Title. Place: Publisher, Year.
- IEEE: [1] A. Author, "Title," Publisher, Year.

Return ONLY the formatted citation, no explanations.`
          },
          {
            role: "user",
            content: `Format this ${type === 'book' ? 'book' : type === 'article' ? 'article' : 'website'} in ${format.toUpperCase()} format: ${source}`
          }
        ],
        temperature: 0.1
      });
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      // AI başarısız oldu — yalnız kayıtlı (admin olmayan) kullanıcıya kredi iade et.
      if (!isAnon && !userIsAdmin) {
        try {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: user!.id,
            p_amount: CREDITS_REQUIRED,
            p_bonus: 0,
            p_payment_id: null,
            p_package_id: null,
            p_idempotency_key: `refund_citation_${user!.id}_${Date.now()}`,
            p_transaction_type: 'refund'
          });
          console.log(`[FormatCitation] Refunded ${CREDITS_REQUIRED} credits to user ${user!.id}`);
        } catch (refundError) {
          console.error('[CRITICAL] Credit refund failed:', refundError);
        }
      }
      return NextResponse.json(
        { error: 'Citation formatting failed. Your credits have been refunded.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      formatted: response.choices[0].message.content,
      ...(isAnon
        ? { anonymous: true, remainingFree: anonRemaining }
        : { creditsUsed: userIsAdmin ? 0 : CREDITS_REQUIRED, remainingCredits: result?.new_balance ?? 0 }),
    });

  } catch (error) {
    console.error('Citation format error:', error);
    return NextResponse.json(
      { error: 'Failed to format citation' },
      { status: 500 }
    );
  }
}