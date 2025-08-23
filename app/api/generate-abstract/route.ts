import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { text, language, wordCount } = await request.json();

    let prompt = '';
    if (language === 'tr') {
      prompt = `Bu akademik çalışma için ${wordCount} kelimelik Türkçe özet yaz. 
      Özet şu bölümleri içermeli: Amaç, Yöntem, Bulgular, Sonuç.`;
    } else if (language === 'en') {
      prompt = `Write a ${wordCount}-word English abstract for this academic work. 
      Include: Purpose, Methods, Findings, Conclusion.`;
    } else {
      prompt = `Bu akademik çalışma için hem ${wordCount} kelimelik Türkçe özet hem de 
      ${wordCount} kelimelik İngilizce abstract yaz. Format: ÖZET: ... ABSTRACT: ...`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Sen akademik özet yazma konusunda uzman bir asistansın. YÖK standartlarına uygun, bilimsel dilde özet hazırla."
        },
        {
          role: "user",
          content: `${prompt}\n\nMetin: ${text.substring(0, 5000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return NextResponse.json({
      abstract: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Özet oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Özet oluşturulamadı' },
      { status: 500 }
    );
  }
}