import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../lib/rateLimit';
import anthropic from "../../lib/anthropic";
import { CREDIT_COSTS } from '../../lib/pricing';

const ACTION_TYPE = 'abstract_generate';
const CREDITS_REQUIRED = CREDIT_COSTS[ACTION_TYPE].creditsRequired;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = rateLimit(`abstract_${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 10, // 10 requests per minute
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

    const { text, language, wordCount } = await request.json();

    // Validate input
    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: 'Please provide thesis content (minimum 100 characters)' },
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
      p_description: `Generate abstract: ${language === 'tr' ? 'Turkish' : language === 'en' ? 'English' : 'Both'}`
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

    // Parse word count range
    const wordCountStr = String(wordCount || '200-300');
    const wordRange = wordCountStr.includes('-') ? wordCountStr : '200-300';
    const [minWords, maxWords] = wordRange.split('-').map((n: string) => parseInt(n));
    
    // Define abstract types based on word count
    let abstractType = '';
    let detailLevel = '';
    if (maxWords <= 150) {
      abstractType = 'concise';
      detailLevel = 'a brief summary covering key findings and conclusions';
    } else if (maxWords <= 300) {
      abstractType = 'standard';
      detailLevel = 'a balanced presentation of purpose, methodology, findings, and conclusions';
    } else {
      abstractType = 'detailed';
      detailLevel = 'a comprehensive summary with detailed methodology, findings, and in-depth conclusion analysis';
    }

    // Build prompt based on language
    let prompt = '';
    if (language === 'tr') {
      prompt = `Write a ${minWords}-${maxWords} word Turkish abstract (ÖZET) for this academic thesis.
This should be ${detailLevel}, including:
- Purpose and Problem Statement (Amaç ve Problem Tanımı)
- Methodology and Approach (Metodoloji ve Yaklaşım)
- Key Findings (Temel Bulgular)
- Conclusions and Recommendations (Sonuç ve Öneriler)

Use academic Turkish language, follow YÖK standards.`;
    } else if (language === 'en') {
      prompt = `Write a ${minWords}-${maxWords} word English abstract for this academic thesis.
This should be ${detailLevel}, including:
- Purpose and Problem Statement
- Methodology and Approach
- Key Findings
- Conclusions and Recommendations

Use academic English, follow international standards.`;
    } else {
      prompt = `Write both a Turkish ÖZET and an English ABSTRACT for this academic thesis.
Each should be ${minWords}-${maxWords} words and ${detailLevel}.

Format:
ÖZET:
[Turkish abstract covering: Amaç, Metodoloji, Bulgular, Sonuç]

ABSTRACT:
[English abstract covering: Purpose, Methodology, Findings, Conclusions]`;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-20250514",
      max_tokens: 2000,
      system: `You are an expert academic abstract writer.
- Follow YÖK (Turkish Higher Education) and international academic standards
- Maintain the specified word count range
- Use precise academic language without unnecessary repetition
- Organize the abstract in a structured manner
- Maintain scientific objectivity`,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nThesis Content:\n${text.substring(0, 12000)}`
        }
      ]
    });

    const content = response.content[0];
    const abstractText = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      abstract: abstractText,
      creditsUsed: CREDITS_REQUIRED,
      remainingCredits: result.new_balance
    });
    
  } catch (error) {
    console.error('Abstract generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate abstract' },
      { status: 500 }
    );
  }
}