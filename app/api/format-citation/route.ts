import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const USAGE_LIMITS = {
  free: { citation_formats: 5 },
  pro: { citation_formats: 100 },
  expert: { citation_formats: -1 }
};

export async function POST(request: NextRequest) {
  try {
    const { source, type, format } = await request.json();
    
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
    const currentUsage = profile?.citation_count || 0;
    const limit = USAGE_LIMITS[subscription as keyof typeof USAGE_LIMITS].citation_formats;

    // Limit kontrolü
    if (limit !== -1 && currentUsage >= limit) {
      return NextResponse.json(
        { error: 'Daha fazla kaynak formatlama için Pro üyelik alın' },
        { status: 403 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sen akademik kaynak formatlama uzmanısın. 
          Verilen kaynak bilgilerini ${format.toUpperCase()} formatına göre düzenle.
          
          Format kuralları:
          - APA 7: Yazar, A. A. (Yıl). Başlık. Yayıncı.
          - MLA 9: Yazar. "Başlık." Yayıncı, Yıl.
          - Chicago: Yazar. Başlık. Yer: Yayıncı, Yıl.
          - IEEE: [1] A. Yazar, "Başlık," Yayıncı, Yıl.
          
          Sadece formatlanmış metni döndür, açıklama ekleme.`
        },
        {
          role: "user",
          content: `Bu ${type === 'book' ? 'kitabı' : type === 'article' ? 'makaleyi' : 'web sitesini'} ${format.toUpperCase()} formatında göster: ${source}`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    // Kullanımı artır
    await supabase
      .from('profiles')
      .update({ citation_count: currentUsage + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      formatted: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Format hatası:', error);
    return NextResponse.json(
      { error: 'Formatlama başarısız' },
      { status: 500 }
    );
  }
}