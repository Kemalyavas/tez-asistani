import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isAdmin } from '@/app/lib/adminUtils';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PDF_CREDIT_COST = 5;

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const userId = session.user.id;
    const userIsAdmin = isAdmin(userId);

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 });
    }

    // Dökümanı al
    const { data: document, error: docError } = await supabaseAdmin
      .from('thesis_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Döküman bulunamadı' }, { status: 404 });
    }

    if (document.status !== 'analyzed') {
      return NextResponse.json(
        { error: 'Döküman henüz analiz edilmedi' },
        { status: 400 }
      );
    }

    // Kredi kontrolü (admin hariç)
    if (!userIsAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < PDF_CREDIT_COST) {
        return NextResponse.json(
          {
            error: 'Yetersiz kredi',
            required: PDF_CREDIT_COST,
            current: profile?.credits || 0,
          },
          { status: 402 }
        );
      }

      // Kredi düş
      await supabaseAdmin.rpc('use_credits', {
        p_user_id: userId,
        p_amount: PDF_CREDIT_COST,
        p_action_type: 'pdf_report',
        p_description: `PDF rapor: ${document.filename}`,
      });
    }

    // PDF HTML içeriği oluştur
    const result = document.analysis_result;
    const pdfHtml = generatePDFHTML(result, document.filename);

    // PDF metadata
    const pdfData = {
      html: pdfHtml,
      documentId,
      filename: document.filename,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      pdfData,
      message: 'PDF verisi oluşturuldu. Tarayıcıda yazdırabilirsiniz.',
    });
  } catch (error) {
    console.error('[PDF Report] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF oluşturulamadı' },
      { status: 500 }
    );
  }
}

function generatePDFHTML(result: any, filename: string): string {
  const date = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const gradeColors: Record<string, string> = {
    'A+': '#10B981',
    'A': '#34D399',
    'A-': '#6EE7B7',
    'B+': '#FCD34D',
    'B': '#FBBF24',
    'B-': '#F59E0B',
    'C+': '#F97316',
    'C': '#EF4444',
    'F': '#DC2626',
  };

  const categoryLabels: Record<string, string> = {
    structure: 'Yapı & Organizasyon',
    methodology: 'Metodoloji',
    writing_quality: 'Yazım Kalitesi',
    references: 'Kaynaklar',
    originality: 'Özgünlük',
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>TezAI Analiz Raporu - ${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    .title { font-size: 20px; color: #6b7280; }
    .date { font-size: 14px; color: #9ca3af; margin-top: 5px; }

    .score-section {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 40px 0;
      padding: 30px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      border: 4px solid ${gradeColors[result.grade?.letter] || '#3b82f6'};
    }
    .score-value { font-size: 36px; font-weight: bold; }
    .score-label { font-size: 14px; color: #6b7280; }
    .grade-info {
      margin-left: 30px;
      text-align: left;
    }
    .grade-letter {
      font-size: 24px;
      font-weight: bold;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      color: white;
      background: ${gradeColors[result.grade?.letter] || '#3b82f6'};
    }
    .grade-label { font-size: 18px; color: #374151; margin-top: 8px; }

    .section { margin: 30px 0; }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .metadata-item {
      text-align: center;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .metadata-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .metadata-label { font-size: 12px; color: #6b7280; }

    .category-list { list-style: none; }
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .category-name { font-weight: 500; }
    .category-score {
      font-weight: bold;
      padding: 4px 12px;
      background: #e5e7eb;
      border-radius: 4px;
    }

    .issue-list { list-style: none; }
    .issue-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .issue-critical {
      background: #fef2f2;
      border-color: #ef4444;
    }
    .issue-major {
      background: #fff7ed;
      border-color: #f97316;
    }
    .issue-minor {
      background: #eff6ff;
      border-color: #3b82f6;
    }
    .issue-severity {
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
    }
    .issue-description { margin-top: 4px; }
    .issue-suggestion {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }

    .strength-list { list-style: none; }
    .strength-item {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
    }
    .strength-item::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }

    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TezAI</div>
    <div class="title">Tez Analiz Raporu</div>
    <div class="date">${date}</div>
  </div>

  <div class="score-section">
    <div class="score-circle">
      <div class="score-value">${result.overallScore}</div>
      <div class="score-label">/ 100</div>
    </div>
    <div class="grade-info">
      <div class="grade-letter">${result.grade?.letter || 'N/A'}</div>
      <div class="grade-label">${result.grade?.label || 'Değerlendirilmedi'}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Döküman Bilgileri</h2>
    <div class="metadata-grid">
      <div class="metadata-item">
        <div class="metadata-value">${result.metadata?.pageCount || 'N/A'}</div>
        <div class="metadata-label">Sayfa</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-value">${result.metadata?.wordCount?.toLocaleString() || 'N/A'}</div>
        <div class="metadata-label">Kelime</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-value">${result.metadata?.referenceCount || 'N/A'}</div>
        <div class="metadata-label">Toplam Kaynak</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-value">${result.metadata?.recentReferenceCount || 'N/A'}</div>
        <div class="metadata-label">Güncel Kaynak</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Kategori Puanları</h2>
    <ul class="category-list">
      ${Object.entries(result.categoryScores || {})
        .map(
          ([key, data]: [string, any]) => `
        <li class="category-item">
          <span class="category-name">${categoryLabels[key] || key}</span>
          <span class="category-score">${data.score}/100</span>
        </li>
      `
        )
        .join('')}
    </ul>
  </div>

  ${
    result.issues?.critical?.length > 0 ||
    result.issues?.major?.length > 0 ||
    result.issues?.minor?.length > 0
      ? `
  <div class="section">
    <h2 class="section-title">Tespit Edilen Sorunlar (${result.issues?.total || 0})</h2>
    <ul class="issue-list">
      ${(result.issues?.critical || [])
        .map(
          (issue: any) => `
        <li class="issue-item issue-critical">
          <div class="issue-severity" style="color: #ef4444;">Kritik</div>
          <div class="issue-description">${issue.description}</div>
          ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
        </li>
      `
        )
        .join('')}
      ${(result.issues?.major || [])
        .map(
          (issue: any) => `
        <li class="issue-item issue-major">
          <div class="issue-severity" style="color: #f97316;">Önemli</div>
          <div class="issue-description">${issue.description}</div>
          ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
        </li>
      `
        )
        .join('')}
      ${(result.issues?.minor || [])
        .slice(0, 5)
        .map(
          (issue: any) => `
        <li class="issue-item issue-minor">
          <div class="issue-severity" style="color: #3b82f6;">Küçük</div>
          <div class="issue-description">${issue.description}</div>
        </li>
      `
        )
        .join('')}
    </ul>
  </div>
  `
      : ''
  }

  ${
    result.strengths?.length > 0
      ? `
  <div class="section">
    <h2 class="section-title">Güçlü Yönler</h2>
    <ul class="strength-list">
      ${result.strengths
        .slice(0, 8)
        .map((s: string) => `<li class="strength-item">${s}</li>`)
        .join('')}
    </ul>
  </div>
  `
      : ''
  }

  ${
    result.recommendations?.length > 0
      ? `
  <div class="section">
    <h2 class="section-title">Geliştirme Önerileri</h2>
    <ul class="strength-list">
      ${result.recommendations.map((r: string) => `<li class="strength-item">${r}</li>`).join('')}
    </ul>
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>Bu rapor TezAI tarafından otomatik olarak oluşturulmuştur.</p>
    <p>© ${new Date().getFullYear()} TezAI - Yapay Zeka Destekli Tez Analiz Platformu</p>
  </div>
</body>
</html>
`;
}
