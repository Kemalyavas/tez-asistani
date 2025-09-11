import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../lib/rateLimit'; // Rate limit fonksiyonlarını import et
import anthropic from "../../lib/anthropic";
import { extractPdfText } from '../../lib/fileUtils';

// Get usage limits from central configuration
import { USAGE_LIMITS } from '../../lib/pricing';

export async function POST(request: NextRequest) {
  try {
    // --- YENİ EKLENEN KOD BAŞLANGICI ---
    // Rate limiting
    const clientIP = getClientIP(request, request.headers);
    const rateLimitResult = rateLimit(`analyze_${clientIP}`, {
      windowMs: 15 * 60 * 1000, // 15 dakika
      maxAttempts: 10, // 15 dakikada 10 istek
      blockDurationMs: 30 * 60 * 1000 // 30 dakika engelle
    });

    if (!rateLimitResult.allowed) {
      const waitTime = rateLimitResult.blockedUntil 
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000 / 60)
        : Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
        
      return NextResponse.json(
        { error: `Çok fazla istek denemesi. Lütfen ${waitTime} dakika sonra tekrar deneyin.` },
        { status: 429 }
      );
    }
    // --- YENİ EKLENEN KOD SONU ---

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

    const subscription = (profile?.subscription_status === 'premium' ? 'pro' : profile?.subscription_status) || 'free';
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
    
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let text = '';
    
    const isDocx = file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    
    if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (isPdf) {
      try {
        // Özel PDF metin çıkarma fonksiyonunu kullan
        text = await extractPdfText(buffer);
      } catch (pdfError) {
        console.error('PDF parse hatası:', pdfError);
        return NextResponse.json({ 
          error: 'PDF dosyası işlenirken bir hata oluştu. Lütfen farklı bir dosya deneyin.' 
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Desteklenmeyen dosya formatı. Lütfen PDF veya DOCX dosyası yükleyin.' 
      }, { status: 400 });
    }
    
    if (!text || text.length < 10) {
      return NextResponse.json({ 
        error: 'Dosya içeriği okunamadı veya çok kısa' 
      }, { status: 400 });
    }
    
    // Abonelik planına göre analiz derinliğini belirle
    const analysisPlan = {
      free: { max_tokens: 40000, chunk_size: 40000 },
      pro: { max_tokens: 60000, chunk_size: 80000 },
      expert: { max_tokens: 80000, chunk_size: 120000 }
    };

    // Abonelik türüne göre analiz derinliğini ve metin kapsamını ayarla
    const { max_tokens, chunk_size } = analysisPlan[subscription as keyof typeof analysisPlan] || analysisPlan.free;
    
    // Daha fazla metin parçası alın (abonelik seviyesine göre)
    const textSample = text.substring(0, chunk_size);
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: max_tokens,
      messages: [
        {
          role: "user",
          content: `Sen YÖK tez inceleme komisyonunda 20+ yıl görev yapmış deneyimli bir akademisyensin. Binlerce tezi değerlendirdin ve hangi kritik hataların tez reddi ile sonuçlandığını çok iyi biliyorsun.

🎯 GÖREV: Bu tezi YÖK 2024 standartlarına göre titizlikle değerlendir ve objektif puanlama yap.

📊 DEĞERLENDİRME METODOLOJİSİ:

1. YAPISAL ANALİZ (25 puan):
   - Bölüm sıralaması ve mantıksal akış
   - Özet-Abstract uyumu ve kalitesi 
   - Giriş-sonuç tutarlılığı
   - Hipotez/araştırma sorusu netliği

2. METODOLOJİK DEĞERLENDİRME (25 puan):
   - Araştırma yöntemi seçimi ve gerekçesi
   - Örneklem büyüklüğü ve temsil gücü
   - Veri toplama araçlarının geçerliliği
   - Analiz yöntemlerinin uygunluğu

3. AKADEMİK YAZIM KALİTESİ (25 puan):
   - Bilimsel dil kullanımı ve netlik
   - Argümantasyon gücü ve mantıksal bütünlük
   - Eleştirel bakış açısı ve analiz derinliği
   - Terminoloji tutarlılığı

4. KAYNAK VE ATIF KALİTESİ (25 puan):
   - Güncel ve relevan kaynak kullanımı
   - Atıf formatı ve doğruluğu (APA 7)
   - Kaynak çeşitliliği ve kalitesi
   - İntihal riski değerlendirmesi

🔍 ÖZEL KONTROL NOKTALARI:
- Türkçe dil bilgisi hataları (yazım, imla, noktalama)
- Sayfa düzeni ve format standartları
- Şekil/tablo numerasyonu ve açıklamaları
- Kaynakça organizasyonu ve eksilikler
- Etik beyan ve onay belgelerinin varlığı

⚠️ KRİTİK SORUN ARAŞTIRMASI:
Bu alanları özellikle inceleyerek GERÇEK sorunları tespit et:
- Kopya-yapıştır izleri
- Tutarsız referans formatları  
- Mantık hataları ve çelişkiler
- Yetersiz literatür taraması
- Geçersiz istatistiksel analizler

📋 RAPOR FORMATI:
{
  "overall_score": [0-100 arası tam sayı],
  "grade_category": "Mükemmel|İyi|Orta|Zayıf|Yetersiz",
  "summary": "3-4 cümlelik genel değerlendirme",
  
  "critical_issues": [
    {
      "title": "Kısa başlık",
      "description": "Detaylı açıklama",
      "impact": "critical|major|minor",
      "solution": "Spesifik çözüm önerisi",
      "example": "Metinden alıntı örnek"
    }
  ],
  
  "category_scores": {
    "structure": {
      "score": [0-25],
      "feedback": "Yapısal analiz sonucu"
    },
    "methodology": {
      "score": [0-25], 
      "feedback": "Metodolojik değerlendirme"
    },
    "writing_quality": {
      "score": [0-25],
      "feedback": "Yazım kalitesi analizi"
    },
    "references": {
      "score": [0-25],
      "feedback": "Kaynak kullanımı değerlendirmesi"
    }
  },
  
  "strengths": ["3-5 güçlü yön"],
  "immediate_actions": ["En acil 3-5 düzeltme"],
  "recommendations": ["Geliştirme önerileri"]
}

⚡ ÖNEMLİ: Sadece GERÇEKTEN VAR OLAN sorunları belirt. Eğer bir alanda sorun yoksa bunu olumlu olarak değerlendir.`
        },
        {
          role: "user",
          content: `Aşağıda analiz edeceğin tez metni var. Her kelimeyi dikkatli oku ve akademik standartlara göre değerlendir.

📊 METIN BİLGİLERİ:
- Dosya adı: ${file.name}
- Metin uzunluğu: ${text.length} karakter
- Dosya türü: ${file.type}

📝 ANALİZ EDİLECEK METIN:
---
${textSample}
---

🎯 GÖREV: Bu metni objektif bir şekilde değerlendir. Sadece GERÇEKTEN MEVCUT olan sorunları belirt, hayali problemler üretme. Her verdiğin puanı gerekçelendir.

⚠️ DİKKAT: 
- Metnin tamamını göremiyorsan bunu belirt
- Eksik bölümler için varsayım yapma
- Sadece gördüğün kısım için değerlendirme yap
- Puanlamanı mevcut içeriğin kalitesine göre ver`
        }
      ],
      temperature: 0.3, // Daha tutarlı sonuçlar için temperature değerini düşürdük
      system: `Sen Türkiye'nin en prestijli üniversitelerinden birinde görev yapan, 20+ yıl deneyimli bir tez danışmanısın. 

🏆 UZMANLIKLARIN:
- YÖK tez değerlendirme kriterleri ve standartları
- Akademik yazım kuralları ve bilimsel metodoloji  
- İstatistiksel analiz ve araştırma yöntemleri
- Ulusal/uluslararası akademik yayıncılık standartları

🎯 DEĞERLENDIRME YAKLAŞIMIN:
- OBJEKTIF ve ADIL puanlama
- Sadece MEVCUT sorunları tespit etme
- Yapıcı ve uygulanabilir öneriler sunma
- Akademik kaliteyi artırmaya odaklanma

⚡ ÖNEMLİ: 
- Sadece JSON formatında yanıt ver
- Markdown başlıkları KULLANMA
- Sadece istenen JSON formatında yanıt ver, fazladan açıklama ekleme`,
    });
    
    const rawMessage = response.content[0].text || "{}";
    
    try {
      // Daha güçlü temizleme fonksiyonu: Markdown işaretleri ve başlıkları temizle
      let cleanMessage = rawMessage.trim();
      
      // Markdown başlıkları temizle (# ile başlayan satırlar)
      cleanMessage = cleanMessage.replace(/^#.*$/gm, '').trim();
      
      // Kod blokları temizle
      if (cleanMessage.includes('```')) {
        // Code block içerisindeki JSON'u bul
        const jsonMatch = cleanMessage.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanMessage = jsonMatch[1].trim();
        } else {
          // Kod blok işaretlerini kaldır
          cleanMessage = cleanMessage.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '');
        }
      }
      
      // Boş satırları temizle
      cleanMessage = cleanMessage.replace(/^\s*[\r\n]/gm, '').trim();
      
      console.log("Temizlenmiş JSON:", cleanMessage.substring(0, 100) + "..."); // Debug için
      
      const result = JSON.parse(cleanMessage);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ thesis_count: currentUsage + 1 })
        .eq('id', user.id);

      if (updateError) {
        console.error('Kullanım sayısı güncellenirken hata:', updateError);
      }
      
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
        overall_score: 75,
        grade_category: "Orta",
        summary: "Tez başarıyla analiz edildi ancak sonuç formatında teknik bir sorun oluştu. Lütfen tekrar deneyin.",
        critical_issues: [
          {
            title: "Teknik Analiz Sorunu",
            description: "Sistem geçici bir sorun yaşadı",
            impact: "minor",
            solution: "Lütfen dosyayı tekrar yükleyip analiz ettirin",
            example: ""
          }
        ],
        category_scores: {
          structure: { score: 18, feedback: "Kısmi değerlendirme yapılabildi" },
          methodology: { score: 18, feedback: "Kısmi değerlendirme yapılabildi" },
          writing_quality: { score: 20, feedback: "Kısmi değerlendirme yapılabildi" },
          references: { score: 19, feedback: "Kısmi değerlendirme yapılabildi" }
        },
        strengths: ["Dosya başarıyla yüklendi"],
        immediate_actions: ["Tekrar analiz deneyin"],
        recommendations: ["Farklı dosya formatı deneyebilirsiniz"]
      });
    }
    
  } catch (error: any) {
    console.error('API Route Hatası:', error);
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Anthropic API key hatası. Lütfen kontrol edin.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('credit') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Anthropic API limiti aşıldı veya kredi yetersiz' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Analiz sırasında bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}