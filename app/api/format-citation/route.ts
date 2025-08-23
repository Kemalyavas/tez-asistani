import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { source, type, format } = await request.json();

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