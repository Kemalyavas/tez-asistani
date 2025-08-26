import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const USAGE_LIMITS = {
  free: { abstracts: 1 },
  pro: { abstracts: 20 },
  expert: { abstracts: -1 }
};

export async function POST(request: NextRequest) {
  try {
    const { text, abstractType } = await request.json();
    
    // Supabase auth kontrolü
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // Kullanıcı profilini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const subscription = profile?.subscription_status || 'free';
    const currentUsage = profile?.abstract_count || 0;
    const limit = USAGE_LIMITS[subscription as keyof typeof USAGE_LIMITS].abstracts;

    // Limit kontrolü
    if (limit !== -1 && currentUsage >= limit) {
      return NextResponse.json(
        { error: 'Daha fazla özet üretmek için Pro üyelik alın' },
        { status: 403 }
      );
    }

    const typeSettings = {
      structured: {
        prompt: "Amaç, Yöntem, Bulgular, Sonuç bölümlerini içeren yapılandırılmış bir özet hazırla.",
        maxTokens: 300
      },
      descriptive: {
        prompt: "Çalışmanın ana konularını ve bulgularını özetleyen açıklayıcı bir özet hazırla.",
        maxTokens: 250
      },
      informative: {
        prompt: "Çalışmanın amaç, yöntem, sonuç ve önemini kapsayan bilgilendirici bir özet hazırla.",
        maxTokens: 300
      }
    };

    const settings = typeSettings[abstractType as keyof typeof typeSettings] || typeSettings.descriptive;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sen akademik özet yazma uzmanısın. Verilen metni analiz ederek ${abstractType} türünde bir özet hazırla. ${settings.prompt} Özet akademik standartlara uygun, net ve anlaşılır olmalı.`
        },
        {
          role: "user",
          content: `Bu metni özetle: ${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: settings.maxTokens
    });

    // Kullanımı artır
    await supabase
      .from('profiles')
      .update({ abstract_count: currentUsage + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      abstract: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Özet üretme hatası:', error);
    return NextResponse.json(
      { error: 'Özet üretimi başarısız' },
      { status: 500 }
    );
  }
}
