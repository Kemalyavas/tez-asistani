import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../lib/rateLimit';
import openai from "../../lib/openai";
import { CREDIT_COSTS } from '../../lib/pricing';

const ACTION_TYPE = 'citation_format';
const CREDITS_REQUIRED = CREDIT_COSTS[ACTION_TYPE].creditsRequired;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = rateLimit(`citation_${clientIP}`, {
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

    // Supabase auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

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

    const result = creditResult?.[0];
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

    // Process the citation formatting with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cheaper model for simple task
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

    return NextResponse.json({
      formatted: response.choices[0].message.content,
      creditsUsed: CREDITS_REQUIRED,
      remainingCredits: result.new_balance
    });
    
  } catch (error) {
    console.error('Citation format error:', error);
    return NextResponse.json(
      { error: 'Failed to format citation' },
      { status: 500 }
    );
  }
}