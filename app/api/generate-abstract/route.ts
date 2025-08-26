import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { text, language, wordCount } = await request.json();

    // Parse word count range - ensure it's a string
    const wordCountStr = String(wordCount);
    const wordRange = wordCountStr.includes('-') ? wordCountStr : '200-300';
    const [minWords, maxWords] = wordRange.split('-').map((n: string) => parseInt(n));
    
    // Define abstract types based on word count
    let abstractType = '';
    let detailLevel = '';
    if (maxWords <= 150) {
      abstractType = 'kısa';
      detailLevel = 'temel bulgular ve sonuçları içeren özet bir';
    } else if (maxWords <= 300) {
      abstractType = 'standart';
      detailLevel = 'amaç, yöntem, bulgular ve sonuçları dengeli şekilde sunan';
    } else {
      abstractType = 'detaylı';
      detailLevel = 'kapsamlı metodoloji, detaylı bulgular ve derinlemesine sonuç analizi içeren';
    }

    let prompt = '';
    if (language === 'tr') {
      prompt = `Bu akademik tez için ${minWords}-${maxWords} kelime arasında ${abstractType} Türkçe özet yaz. 
      Bu ${detailLevel} özet şu bölümleri içermeli:
      - Amaç ve Problem Tanımı
      - Metodoloji ve Yaklaşım
      - Temel Bulgular
      - Sonuç ve Öneriler
      
      Akademik dil kullan, YÖK standartlarına uygun hazırla.`;
    } else if (language === 'en') {
      prompt = `Write a ${minWords}-${maxWords} word ${abstractType} English abstract for this academic thesis. 
      This ${detailLevel} abstract should include:
      - Purpose and Problem Statement
      - Methodology and Approach
      - Key Findings
      - Conclusions and Recommendations
      
      Use academic language, follow international standards.`;
    } else {
      prompt = `Bu akademik tez için hem ${minWords}-${maxWords} kelimelik Türkçe özet hem de 
      ${minWords}-${maxWords} kelimelik İngilizce abstract yaz. 
      
      Her ikisi de ${detailLevel} özet olmalı ve şunları içermeli:
      - Amaç ve Problem Tanımı / Purpose and Problem Statement
      - Metodoloji / Methodology  
      - Bulgular / Findings
      - Sonuç / Conclusions
      
      Format: 
      ÖZET:
      [Türkçe özet]
      
      ABSTRACT:
      [English abstract]`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sen akademik özet yazma konusunda uzman bir asistansın. 
          - YÖK ve uluslararası akademik standartlara uygun özet hazırla
          - Belirtilen kelime sayısı aralığına dikkat et
          - Akademik dil kullan, gereksiz tekrarlardan kaçın
          - Özeti yapılandırılmış şekilde organize et
          - Bilimsel objektifliği koru`
        },
        {
          role: "user",
          content: `${prompt}\n\nTez İçeriği: ${text.substring(0, 8000)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
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