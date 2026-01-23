import type { AnalysisContext } from './types';

// Yapı Analizi Prompt
export function getStructurePrompt(context: AnalysisContext, text: string): string {
  return `
Verilen tez metninin YAPI ve ORGANİZASYON kalitesini değerlendir.

## Değerlendirme Kriterleri (Toplam 100 puan):
1. Giriş kalitesi (problem tanımı, amaç, kapsam) - max 20 puan
2. Literatür taraması kapsamlılığı - max 20 puan
3. Metodoloji sunumu netliği - max 20 puan
4. Bulgular organizasyonu - max 20 puan
5. Sonuç ve tartışma bütünlüğü - max 20 puan

## Mevcut Yapı Bilgisi:
- Tespit edilen bölümler: ${context.sections.map(s => s.title).join(', ')}
- Sayfa sayısı: ~${context.pageCount}
- Kelime sayısı: ${context.wordCount}
- Dil: ${context.language === 'tr' ? 'Türkçe' : context.language === 'en' ? 'İngilizce' : 'Karma'}

## Tez Metni (ilk 80.000 karakter):
${text.substring(0, 80000)}

## Yanıt Formatı (JSON):
{
  "score": 0-100,
  "subScores": {
    "introduction": 0-20,
    "literature": 0-20,
    "methodology": 0-20,
    "results": 0-20,
    "conclusion": 0-20
  },
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel değerlendirme (2-3 cümle)"
}
`;
}

// Metodoloji Analizi Prompt
export function getMethodologyPrompt(context: AnalysisContext, text: string): string {
  return `
Verilen tez metninin METODOLOJİ kalitesini değerlendir.

## Değerlendirme Kriterleri (Toplam 100 puan):
1. Araştırma tasarımı uygunluğu - max 20 puan
2. Örneklem seçimi ve gerekçesi - max 15 puan
3. Veri toplama yöntemleri - max 20 puan
4. Analiz tekniklerinin uygunluğu - max 20 puan
5. Geçerlilik ve güvenilirlik önlemleri - max 15 puan
6. Sınırlılıkların farkındalığı - max 10 puan

## Bağlam:
- Alan: ${context.fieldOfStudy}
- Akademik Seviye: ${context.academicLevel}
- Dil: ${context.language === 'tr' ? 'Türkçe' : context.language === 'en' ? 'İngilizce' : 'Karma'}

## Tez Metni:
${text}

## Yanıt Formatı (JSON):
{
  "score": 0-100,
  "subScores": {
    "researchDesign": 0-20,
    "sampling": 0-15,
    "dataCollection": 0-20,
    "analysisMethod": 0-20,
    "validityReliability": 0-15,
    "limitations": 0-10
  },
  "researchType": "nicel" | "nitel" | "karma",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel metodoloji değerlendirmesi (3-4 cümle)"
}
`;
}

// Yazım Kalitesi Analizi Prompt
export function getWritingPrompt(context: AnalysisContext, text: string): string {
  return `
Verilen tez metninin YAZIM KALİTESİNİ değerlendir.

## Değerlendirme Kriterleri (Toplam 100 puan):
1. Akademik dil ve üslup - max 20 puan
2. Argümantasyon gücü - max 20 puan
3. Kanıt kullanımı ve destekleme - max 20 puan
4. Tutarlılık ve mantıksal akış - max 20 puan
5. Dilbilgisi ve imla - max 10 puan
6. Teknik terminoloji doğruluğu - max 10 puan

## Bağlam:
- Dil: ${context.language === 'tr' ? 'Türkçe' : context.language === 'en' ? 'İngilizce' : 'Karma'}
- Alan: ${context.fieldOfStudy}
- Akademik Seviye: ${context.academicLevel}

## Dikkat Edilecekler:
- Türkçe metinler için TDK kurallarına uygunluk
- Akademik üslup ve nesnel anlatım
- Paragraflararası geçişler
- Alıntı ve aktarım kalitesi

## Tez Metni:
${text}

## Yanıt Formatı (JSON):
{
  "score": 0-100,
  "subScores": {
    "academicStyle": 0-20,
    "argumentation": 0-20,
    "evidenceUse": 0-20,
    "coherence": 0-20,
    "grammar": 0-10,
    "terminology": 0-10
  },
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "bölüm/sayfa/paragraf bilgisi",
      "suggestion": "düzeltme önerisi",
      "example": "örnek hatalı cümle (varsa)"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel yazım değerlendirmesi (3-4 cümle)"
}
`;
}

// Kaynak Analizi Prompt
export function getReferencesPrompt(context: AnalysisContext, text: string): string {
  return `
Verilen tez metninin KAYNAKLAR ve ATIF kalitesini değerlendir.

## Değerlendirme Kriterleri (Toplam 100 puan):
1. Kaynak çeşitliliği ve kalitesi - max 25 puan
2. Güncel literatür kullanımı (son 5 yıl) - max 25 puan
3. Atıf formatı tutarlılığı - max 20 puan
4. Metin içi atıf kullanımı - max 20 puan
5. Kaynakça-metin uyumu - max 10 puan

## Mevcut Kaynak Bilgisi:
- Toplam kaynak sayısı: ${context.references.totalCount}
- Güncel kaynak sayısı (son 5 yıl): ${context.references.recentCount}
- Güncellik oranı: %${context.references.totalCount > 0 ? Math.round((context.references.recentCount / context.references.totalCount) * 100) : 0}

## Dikkat Edilecekler:
- Birincil ve ikincil kaynak dengesi
- Hakemli dergi kullanımı
- Kitap, tez ve konferans bildirisi çeşitliliği
- Türkçe ve yabancı kaynak dengesi

## Tez Metni:
${text}

## Yanıt Formatı (JSON):
{
  "score": 0-100,
  "subScores": {
    "sourceDiversity": 0-25,
    "recency": 0-25,
    "formatConsistency": 0-20,
    "inTextCitations": 0-20,
    "bibliographyMatch": 0-10
  },
  "detectedStyle": "APA" | "IEEE" | "Chicago" | "MLA" | "Mixed" | "Unknown",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "location": "kaynak/sayfa bilgisi",
      "suggestion": "düzeltme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel kaynak değerlendirmesi (2-3 cümle)"
}
`;
}

// Özgünlük Analizi Prompt
export function getOriginalityPrompt(context: AnalysisContext, text: string): string {
  return `
Verilen tez metninin ÖZGÜNLÜK ve AKADEMİK KATKI düzeyini değerlendir.

## Değerlendirme Kriterleri (Toplam 100 puan):
1. Araştırma sorusunun özgünlüğü - max 30 puan
2. Literatüre katkı - max 30 puan
3. Pratik uygulanabilirlik - max 20 puan
4. Gelecek araştırma önerileri - max 20 puan

## Bağlam:
- Alan: ${context.fieldOfStudy}
- Akademik Seviye: ${context.academicLevel}

## Dikkat Edilecekler:
- Araştırma boşluğunun belirlenmesi
- Özgün yaklaşım veya yöntem önerisi
- Teorik çerçeveye katkı
- Uygulama alanı potansiyeli

## Tez Metni:
${text}

## Yanıt Formatı (JSON):
{
  "score": 0-100,
  "subScores": {
    "researchQuestion": 0-30,
    "contribution": 0-30,
    "applicability": 0-20,
    "futureResearch": 0-20
  },
  "contributionType": "theoretical" | "practical" | "methodological" | "mixed",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "description": "sorun açıklaması",
      "suggestion": "geliştirme önerisi"
    }
  ],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "feedback": "genel özgünlük değerlendirmesi (2-3 cümle)"
}
`;
}

// Agent ID'ye göre prompt seç
export function getPromptForAgent(
  agentId: string,
  context: AnalysisContext,
  text: string
): string {
  switch (agentId) {
    case 'structure':
      return getStructurePrompt(context, text);
    case 'methodology':
      return getMethodologyPrompt(context, text);
    case 'writing':
      return getWritingPrompt(context, text);
    case 'references':
      return getReferencesPrompt(context, text);
    case 'originality':
      return getOriginalityPrompt(context, text);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}

// Çapraz Doğrulama Prompt
export function getCrossValidationPrompt(
  context: AnalysisContext,
  text: string,
  previousResults: Record<string, { score: number; issues: unknown[]; strengths: string[] }>
): string {
  return `
Sen deneyimli bir akademik tez değerlendirme uzmanısın.
Başka bir AI sistemi (Gemini) tez analizi yaptı.
Senin görevin bu analizi doğrulamak ve potansiyel tutarsızlıkları tespit etmek.

## Gemini Analiz Sonuçları:
${JSON.stringify(previousResults, null, 2)}

## Tez Metni (ilk 100.000 karakter):
${text.substring(0, 100000)}

## Görevlerin:
1. Gemini'nin her kategori için verdiği puanları değerlendir
2. Gözden kaçmış önemli sorunları tespit et
3. Yanlış veya abartılı değerlendirmeleri işaretle
4. Kendi bağımsız değerlendirmeni yap

## Yanıt Formatı (JSON):
{
  "validationResults": {
    "structure": {
      "geminiScore": number,
      "claudeScore": number,
      "agreement": "agree" | "partial" | "disagree",
      "adjustedScore": number,
      "reason": "açıklama"
    },
    "methodology": { ... },
    "writing": { ... },
    "references": { ... },
    "originality": { ... }
  },
  "missedIssues": [
    {
      "severity": "critical" | "major" | "minor",
      "category": string,
      "description": string,
      "suggestion": string
    }
  ],
  "overestimatedIssues": [
    {
      "originalIssue": string,
      "reason": "neden abartılı olduğu"
    }
  ],
  "calibratedOverallScore": number,
  "confidence": 0-100,
  "summary": "Genel çapraz doğrulama özeti (3-4 cümle)"
}
`;
}
