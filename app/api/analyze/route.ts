import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Kullanım limitleri
const USAGE_LIMITS = {
  free: { thesis_analyses: 1 },
  pro: { thesis_analyses: 50 },
  expert: { thesis_analyses: -1 } // sınırsız
};

export async function POST(request: NextRequest) {
  console.log('API Route çalıştı');
  console.log('OpenAI Key var mı:', !!process.env.OPENAI_API_KEY);
  console.log('Key başlangıcı:', process.env.OPENAI_API_KEY?.substring(0, 10));
  
  try {
    // Kullanıcı authentication kontrolü
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
    const currentUsage = profile?.thesis_count || 0;
    const limit = USAGE_LIMITS[subscription as keyof typeof USAGE_LIMITS].thesis_analyses;

    // Limit kontrolü
    if (limit !== -1 && currentUsage >= limit) {
      return NextResponse.json(
        { error: 'Daha fazla tez analizi için Pro üyelik alın' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('Dosya alındı:', file?.name);
    
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let text = '';
    
    // File type ve extension kontrolü
    const isDocx = file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    
    if (isDocx) {
      console.log('DOCX dosyası işleniyor');
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (isPdf) {
      console.log('PDF dosyası işleniyor');
      // Dynamic import for pdf-parse
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      text = data.text;
    } else {
      console.log('Desteklenmeyen dosya tipi:', file.type, 'Dosya adı:', file.name);
      return NextResponse.json({ 
        error: 'Desteklenmeyen dosya formatı. Lütfen PDF veya DOCX dosyası yükleyin.' 
      }, { status: 400 });
    }
    
    console.log('Text uzunluğu:', text.length);
    console.log('İlk 100 karakter:', text.substring(0, 100));
    
    if (!text || text.length < 10) {
      return NextResponse.json({ 
        error: 'Dosya içeriği okunamadı veya çok kısa' 
      }, { status: 400 });
    }

    console.log('OpenAI çağrısı yapılıyor...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sen YÖK (Yükseköğretim Kurulu) tez yazım standartları konusunda 15+ yıl deneyimli, akademik yazım uzmanısın. Türkiye'deki tüm üniversitelerin tez formatı gereksinimlerini biliyorsun.

GÖREV: Yüklenen tez metnini YÖK 2024 standartlarına göre detaylı analiz et.

ANALİZ KRİTERLERİ:

1. FORMAT VE DÜZENLEMİ:
   - Sayfa kenar boşlukları (üst: 3cm, alt: 2.5cm, sol: 4cm, sağ: 2.5cm)
   - Yazı tipi ve boyutu (Times New Roman 12pt, başlıklar için farklı boyutlar)
   - Satır aralığı (1.5 satır aralığı)
   - Paragraf girintileri (1.25 cm)
   
2. BAŞLIK HİYERARŞİSİ:
   - Ana başlıklar (1. GİRİŞ, 2. KURAMSAL ÇERÇEVE, vb.)
   - Alt başlıklar (1.1, 1.2, 1.1.1, vb.)
   - Başlık numaralandırma tutarlılığı
   - Büyük-küçük harf kullanımı
   
3. KAYNAK GÖSTERİMİ:
   - Metin içi atıflar (APA 7. Edisyon)
   - Doğru parantez kullanımı [(Yazar, Yıl) veya (Yazar, Yıl, s. X)]
   - Çoklu kaynak gösterimi
   - İnternet kaynakları formatı
   
4. KAYNAKÇA:
   - Alfabetik sıralama
   - Asılı girinti (hanging indent)
   - Noktalama işaretleri
   - DOI/URL formatları
   
5. ŞEKİL VE TABLOLAR:
   - Numaralandırma (Şekil 1.1, Tablo 2.3, vb.)
   - Başlık yerleşimi (şekillerde alt, tablolarda üst)
   - Kaynak belirtimi
   - Metin içi referanslar
   
6. YAZIM VE DİL:
   - Akademik dil kullanımı
   - Birinci şahıs kullanım hatası
   - Türkçe karakter kullanımı
   - Noktalama kuralları
   
7. İÇİNDEKİLER VE SAYFA:
   - Sayfa numaralandırma
   - İçindekiler formatı
   - Özet sayfası düzeni
   - Abstract formatı

ÇIKTI FORMATI:
{
  "formatIssues": [
    {
      "category": "Format|Başlık|Kaynak|Yazım|Şekil-Tablo",
      "type": "Spesifik Konu",
      "message": "Detaylı açıklama ve öneride bulunacağın çözüm",
      "severity": "critical|major|minor|info",
      "location": "Hangi bölümde/sayfada",
      "example": "Varsa yanlış kullanım örneği"
    }
  ],
  "suggestions": [
    "Somut, uygulanabilir iyileştirme önerileri",
    "YÖK standartlarına uyum için adımlar"
  ],
  "score": 0-100,
  "summary": "Genel değerlendirme ve öncelikli düzeltmeler",
  "positiveAspects": ["Tespit edilen doğru uygulamalar"],
  "compliance": {
    "format": 0-100,
    "citations": 0-100,
    "structure": 0-100,
    "language": 0-100
  }
}
  Sonuçları JSON formatında döndür.

ÖNEMLİ: Eleştirirken yapıcı ol, somut çözümler sun, YÖK standartlarını referans al.`
        },
        {
          role: "user",
          content: `Aşağıdaki tez metnini YÖK 2024 standartlarına göre kapsamlı bir şekilde analiz et. 

METIN UZUNLUĞU: ${text.length} karakter
DOSYA ADI: ${file.name}
DOSYA TİPİ: ${file.type}

ANALİZ EDİLECEK METIN:
---
${text.substring(0, 4000)}
---

Lütfen yukarıdaki sistem talimatlarında belirtilen tüm kriterleri değerlendirerek detaylı bir analiz raporu hazırla. Her tespit ettiğin sorunu, hangi YÖK standardını ihlal ettiğini ve nasıl düzeltileceğini net bir şekilde belirt.`
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI yanıtı alındı');
    
    const rawMessage = completion.choices[0].message?.content || "{}";
    console.log('Ham yanıt:', rawMessage);
    
    try {
      const result = JSON.parse(rawMessage);
      
      // Başarılı analiz sonrası kullanım sayısını artır
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ thesis_count: currentUsage + 1 })
        .eq('id', user.id);

      if (updateError) {
        console.error('Kullanım sayısı güncellenirken hata:', updateError);
      }
      
      // Documents tablosuna kayıt ekle (isteğe bağlı - istatistik için)
      await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_type: file.type,
          file_size: file.size,
          processed: true,
          analysis_result: result
        });
      
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError);
      return NextResponse.json({
        formatIssues: [
          {
            type: "Analiz",
            message: "Tez başarıyla analiz edildi ancak sonuç formatında sorun var",
            severity: "info"
          }
        ],
        suggestions: ["Lütfen tekrar deneyin"],
        score: 75
      });
    }
    
  } catch (error: any) {
    console.error('API Route Hatası:', error);
    console.error('Hata detayı:', error.message);
    console.error('Hata kodu:', error.code);
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key hatası. Lütfen kontrol edin.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('credit')) {
      return NextResponse.json(
        { error: 'OpenAI kredi yetersiz' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Analiz sırasında bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}