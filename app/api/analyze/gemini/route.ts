import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { analyzeWithGeminiJSON } from '@/app/lib/gemini-simple';
import { extractPdfText } from '@/app/lib/fileUtils';
import { isAdmin } from '@/app/lib/adminUtils';

// 5 dakika timeout (Vercel Pro)
export const maxDuration = 300;

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tier belirleme
function getTier(pageCount: number): { tier: 'basic' | 'standard' | 'comprehensive'; credits: number } {
  if (pageCount < 50) return { tier: 'basic', credits: 10 };
  if (pageCount < 150) return { tier: 'standard', credits: 25 };
  return { tier: 'comprehensive', credits: 50 };
}

// Not skalası
function getGrade(score: number) {
  if (score >= 95) return { letter: 'A+', label: 'Mükemmel', color: '#10B981' };
  if (score >= 90) return { letter: 'A', label: 'Çok İyi', color: '#34D399' };
  if (score >= 85) return { letter: 'A-', label: 'İyi', color: '#6EE7B7' };
  if (score >= 80) return { letter: 'B+', label: 'Ortanın Üstü', color: '#FCD34D' };
  if (score >= 75) return { letter: 'B', label: 'Orta', color: '#FBBF24' };
  if (score >= 70) return { letter: 'B-', label: 'Kabul Edilebilir', color: '#F59E0B' };
  if (score >= 65) return { letter: 'C+', label: 'Zayıf', color: '#F97316' };
  if (score >= 60) return { letter: 'C', label: 'Yetersiz', color: '#EF4444' };
  return { letter: 'F', label: 'Başarısız', color: '#DC2626' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth kontrolü
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const userId = session.user.id;
    const userIsAdmin = isAdmin(userId);

    // Request body
    const body = await request.json();
    const { filePath, fileName } = body;

    if (!filePath || !fileName) {
      return NextResponse.json({ error: 'filePath ve fileName gerekli' }, { status: 400 });
    }

    // Dosyayı indir
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('thesis-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Dosya indirilemedi' }, { status: 404 });
    }

    // Buffer'a çevir ve metin çıkar
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text = '';

    if (fileName.toLowerCase().endsWith('.pdf')) {
      text = await extractPdfText(buffer);
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: 'Desteklenmeyen dosya formatı' }, { status: 400 });
    }

    if (!text || text.length < 500) {
      return NextResponse.json({ error: 'Dosyadan yeterli metin çıkarılamadı' }, { status: 400 });
    }

    // İstatistikler
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.ceil(text.length / 2750);
    const { tier, credits } = getTier(pageCount);

    // Kredi kontrolü
    if (!userIsAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < credits) {
        return NextResponse.json({
          error: 'Yetersiz kredi',
          required: credits,
          current: profile?.credits || 0
        }, { status: 402 });
      }

      // Kredi düş
      await supabaseAdmin.rpc('use_credits', {
        p_user_id: userId,
        p_amount: credits,
        p_action_type: `thesis_${tier}`,
        p_description: `Tez analizi (Gemini): ${fileName}`
      });
    }

    // Döküman kaydı oluştur
    const { data: document, error: insertError } = await supabaseAdmin
      .from('thesis_documents')
      .insert({
        user_id: userId,
        filename: fileName,
        file_size: buffer.length,
        file_type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
        page_count: pageCount,
        word_count: wordCount,
        status: 'processing',
        analysis_type: tier,
        credits_used: userIsAdmin ? 0 : credits,
      })
      .select()
      .single();

    if (insertError || !document) {
      // Kredi iadesi
      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null
        });
      }
      return NextResponse.json({ error: 'Döküman kaydedilemedi' }, { status: 500 });
    }

    try {
      // ============================================
      // MULTI-AGENT ANALİZ (Gemini ile)
      // ============================================

      const textSample = text.length > 100000 ? text.substring(0, 100000) : text;

      // 1. YAPI ANALİZİ
      const structureResult = await analyzeWithGeminiJSON(`
Sen akademik tez yapısı uzmanısın. Bu tezi değerlendir:

${textSample.substring(0, 50000)}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "issues": [{"severity": "critical|major|minor", "description": "sorun", "suggestion": "öneri"}],
  "strengths": ["güçlü yön"],
  "feedback": "2-3 cümle değerlendirme"
}
`, false);

      // 2. METODOLOJİ ANALİZİ
      const methodologyResult = await analyzeWithGeminiJSON(`
Sen araştırma metodolojisi uzmanısın. Bu tezin metodolojisini değerlendir:

${textSample}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "researchType": "nicel|nitel|karma",
  "issues": [{"severity": "critical|major|minor", "description": "sorun", "suggestion": "öneri"}],
  "strengths": ["güçlü yön"],
  "feedback": "3-4 cümle değerlendirme"
}
`, true);

      // 3. YAZIM KALİTESİ
      const writingResult = await analyzeWithGeminiJSON(`
Sen akademik yazım uzmanısın. Bu tezin yazım kalitesini değerlendir:

${textSample}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "issues": [{"severity": "critical|major|minor", "description": "sorun", "location": "yer", "suggestion": "öneri"}],
  "strengths": ["güçlü yön"],
  "feedback": "3-4 cümle değerlendirme"
}
`, true);

      // 4. KAYNAK ANALİZİ
      const referencesResult = await analyzeWithGeminiJSON(`
Sen akademik kaynak uzmanısın. Bu tezin kaynakça ve atıflarını değerlendir:

${text.substring(Math.max(0, text.length - 30000))}

JSON formatında yanıt ver:
{
  "score": 0-100,
  "citationStyle": "APA|IEEE|Chicago|MLA|Mixed|Unknown",
  "totalReferences": number,
  "recentReferences": number,
  "issues": [{"severity": "critical|major|minor", "description": "sorun", "suggestion": "öneri"}],
  "strengths": ["güçlü yön"],
  "feedback": "2-3 cümle değerlendirme"
}
`, false);

      // Sonuçları birleştir
      const structure = structureResult as any || { score: 70, issues: [], strengths: [], feedback: '' };
      const methodology = methodologyResult as any || { score: 70, issues: [], strengths: [], feedback: '' };
      const writing = writingResult as any || { score: 70, issues: [], strengths: [], feedback: '' };
      const references = referencesResult as any || { score: 70, issues: [], strengths: [], feedback: '' };

      // Ağırlıklı ortalama
      const overallScore = Math.round(
        structure.score * 0.20 +
        methodology.score * 0.30 +
        writing.score * 0.25 +
        references.score * 0.25
      );

      const grade = getGrade(overallScore);

      // Tüm sorunları topla
      const allIssues = [
        ...(structure.issues || []).map((i: any) => ({ ...i, category: 'structure' })),
        ...(methodology.issues || []).map((i: any) => ({ ...i, category: 'methodology' })),
        ...(writing.issues || []).map((i: any) => ({ ...i, category: 'writing_quality' })),
        ...(references.issues || []).map((i: any) => ({ ...i, category: 'references' })),
      ];

      // Final sonuç
      const analysisResult = {
        overallScore,
        grade,
        categoryScores: {
          structure: { score: structure.score, feedback: structure.feedback, issues: structure.issues || [], strengths: structure.strengths || [] },
          methodology: { score: methodology.score, feedback: methodology.feedback, issues: methodology.issues || [], strengths: methodology.strengths || [] },
          writing_quality: { score: writing.score, feedback: writing.feedback, issues: writing.issues || [], strengths: writing.strengths || [] },
          references: { score: references.score, feedback: references.feedback, issues: references.issues || [], strengths: references.strengths || [] },
        },
        issues: {
          critical: allIssues.filter((i: any) => i.severity === 'critical'),
          major: allIssues.filter((i: any) => i.severity === 'major'),
          minor: allIssues.filter((i: any) => i.severity === 'minor'),
          total: allIssues.length,
        },
        strengths: [
          ...(structure.strengths || []),
          ...(methodology.strengths || []),
          ...(writing.strengths || []),
          ...(references.strengths || []),
        ].slice(0, 10),
        recommendations: generateRecommendations(overallScore, allIssues),
        immediateActions: allIssues
          .filter((i: any) => i.severity === 'critical')
          .slice(0, 5)
          .map((i: any) => i.suggestion || i.description),
        metadata: {
          wordCount,
          pageCount,
          language: 'tr',
          academicLevel: 'unknown',
          fieldOfStudy: 'Bilinmiyor',
          referenceCount: references.totalReferences || 0,
          recentReferenceCount: references.recentReferences || 0,
        },
        analysisTier: tier,
        crossValidated: false,
        analyzedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      };

      // Veritabanını güncelle
      await supabaseAdmin
        .from('thesis_documents')
        .update({
          status: 'analyzed',
          analysis_result: analysisResult,
          overall_score: overallScore,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      // Dosyayı sil (temizlik)
      await supabaseAdmin.storage.from('thesis-uploads').remove([filePath]);

      return NextResponse.json({
        success: true,
        documentId: document.id,
        result: analysisResult,
      });

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);

      // Hata durumunda kredi iadesi
      if (!userIsAdmin) {
        await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_bonus: 0,
          p_payment_id: null,
          p_package_id: null
        });
      }

      // Dökümanı failed olarak işaretle
      await supabaseAdmin
        .from('thesis_documents')
        .update({ status: 'failed' })
        .eq('id', document.id);

      throw analysisError;
    }

  } catch (error) {
    console.error('Gemini analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analiz başarısız' },
      { status: 500 }
    );
  }
}

function generateRecommendations(score: number, issues: any[]): string[] {
  const recommendations: string[] = [];

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const majorCount = issues.filter(i => i.severity === 'major').length;

  if (criticalCount > 0) {
    recommendations.push(`${criticalCount} kritik sorun tespit edildi. Teslimden önce bunları mutlaka düzeltin.`);
  }

  if (majorCount > 0) {
    recommendations.push(`${majorCount} önemli sorun var. Bunları düzeltmek puanınızı önemli ölçüde artırır.`);
  }

  if (score < 70) {
    recommendations.push('Genel kaliteyi artırmak için tüm kategorilerde iyileştirme yapmanız önerilir.');
  } else if (score >= 85) {
    recommendations.push('Teziniz iyi durumda! Küçük düzeltmelerle mükemmel hale getirilebilir.');
  }

  return recommendations.length > 0 ? recommendations : ['Teziniz genel olarak iyi durumda.'];
}
