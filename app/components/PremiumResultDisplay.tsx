'use client';

import { useState } from 'react';
import {
  CheckCircle, AlertTriangle, AlertCircle, XCircle, ChevronDown, FileText,
  PenTool, Quote, Layout, Target, Award, TrendingUp, MapPin, Lightbulb,
  Shield, BarChart3, BookOpen, Scale, ArrowRight, Check, X, Star,
} from 'lucide-react';
import RubricFeedbackButton from './RubricFeedbackButton';

interface PremiumResultDisplayProps {
  result: any;
  documentId?: string;
}

// ---- Kategori meta ----
const SECTION_LABELS: Record<string, string> = {
  formatting: 'Biçimsel Kurallar',
  structure: 'Yapı ve Organizasyon',
  introduction: 'Giriş',
  literature: 'Literatür Taraması',
  methodology: 'Metodoloji',
  findings: 'Bulgular',
  discussion: 'Tartışma',
  conclusion: 'Sonuç ve Öneriler',
  originality: 'Özgünlük ve Katkı',
  writingQuality: 'Akademik Yazım',
  references: 'Kaynaklar ve Atıflar',
};

function sectionLabel(key: string) {
  return SECTION_LABELS[key] || key;
}

// score → bar rengi (editorial palet)
function scoreBar(s: number) {
  if (s >= 85) return '#15803d';
  if (s >= 70) return '#65a30d';
  if (s >= 55) return '#ca8a04';
  if (s >= 40) return '#ea580c';
  return '#e11d48';
}
function scoreCol(s: number) {
  if (s >= 85) return '#15803d';
  if (s >= 70) return '#4d7c0f';
  if (s >= 55) return '#a16207';
  if (s >= 40) return '#c2410c';
  return '#be123c';
}

// severity meta (editorial palet)
function sevMeta(sev: string) {
  switch (sev) {
    case 'critical': return { label: 'KRİTİK', col: '#be123c' };
    case 'major': return { label: 'ÖNEMLİ', col: '#b45309' };
    case 'minor': return { label: 'KÜÇÜK', col: '#a16207' };
    default: return { label: 'BİÇİM', col: '#1e3a8a' };
  }
}

// Deterministik jüri hükmü — eldeki veriden (AI yok, çelişki yok, her zaman tutarlı)
function buildVerdict(
  sortedCats: { key: string; label: string; score: number }[],
  topCritical: any | null,
  gradeLetter: string,
  overallScore: number,
): string {
  if (!sortedCats.length) return '';
  const strong = sortedCats.filter((c) => c.score >= 80).slice(0, 2).map((c) => c.label);
  const weakest = sortedCats[sortedCats.length - 1];
  // Gerçek KRİTİK (core kriter tamamen yok) — "kapı" kuralıyla tutarlı.
  const hasCritical = topCritical?.severity === 'critical';

  let durum: string;
  if (hasCritical) {
    // Kritik eksik varken yüksek puan olsa bile "küçük rötuş" deme (genel not zaten tavanlı).
    durum = overallScore >= 65
      ? 'genelinde sağlam, ancak kritik eksik giderilmeden üst notlara çıkamaz'
      : 'kritik eksik giderilmeden savunmaya hazır değil';
  } else if (overallScore >= 80) durum = 'sağlam; küçük rötuşlarla daha da yükselir';
  else if (overallScore >= 65) durum = 'savunulabilir, ancak öncelikli eksikler giderilmeli';
  else if (overallScore >= 50) durum = 'ciddi revizyon gerektiriyor';
  else durum = 'kapsamlı revizyon şart';

  const parts: string[] = [];
  if (strong.length) parts.push(`Tez ${strong.join(' ve ')} alanlarında güçlü.`);
  if (weakest && weakest.score < 70) parts.push(`${weakest.label} (${weakest.score}/100) en zayıf alan.`);
  if (topCritical) {
    const pg = topCritical.pageNumber ? ` (S.${topCritical.pageNumber})` : '';
    parts.push(`${hasCritical ? 'Kritik eksik' : 'En öncelikli eksik'}: ${topCritical.title}${pg}.`);
  }
  parts.push(`${gradeLetter} notuyla ${durum}.`);
  return parts.join(' ');
}

export default function PremiumResultDisplay({ result, documentId }: PremiumResultDisplayProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'major' | 'minor' | 'formatting'>('all');
  const [showYok, setShowYok] = useState(false);

  const toggleCat = (k: string) => {
    const next = new Set(expandedCats);
    next.has(k) ? next.delete(k) : next.add(k);
    setExpandedCats(next);
  };

  // ---- Veri çıkarma (guard'lı, geriye uyumlu) ----
  const overallScore: number = result.overallScore ?? result.overall_score ?? 0;
  const grade = result.grade || { letter: 'B', label: 'Orta', color: '#2a52a8' };
  const sections: Record<string, any> = result.sections || result.categoryScores || {};
  const issues = result.issues || {
    critical: result.criticalIssues || result.critical_issues || [],
    major: result.majorIssues || result.major_issues || [],
    minor: result.minorIssues || result.minor_issues || [],
    formatting: result.formattingIssues || [],
  };
  const stats = result.statistics || result.metadata || {};
  const strengths: string[] = result.strengths || [];
  const yok = result.yokCompliance || { score: 0, compliant: [], nonCompliant: [] };
  const studyType: string = result.studyType || '';
  const likelyPartialUpload: boolean = result.likelyPartialUpload === true;
  const notThesisFormat: boolean = result.notThesisFormat === true;
  const docTypeLabel: string =
    ({
      proposal: 'proje önerisi / proje raporu',
      report: 'rapor',
      article: 'makale',
      other: 'akademik tez dışında bir belge',
    } as Record<string, string>)[result.documentType] || 'akademik tez dışında bir belge';

  // sıralı kategoriler (yüksek → düşük). applicable=false → bu tez türünde uygulanmadı.
  const sortedCats = Object.entries(sections)
    .map(([key, v]: [string, any]) => ({ key, label: sectionLabel(key), score: v?.score ?? 0, applicable: v?.applicable !== false, data: v }))
    .sort((a, b) => b.score - a.score);
  // Genel not / en güçlü / en zayıf yalnızca UYGULANABİLİR kategorilerden hesaplanır
  // (n/a kategori 0 puanla "en zayıf" gibi görünmesin).
  const applicableCats = sortedCats.filter((c) => c.applicable);

  // tüm sorunlar (severity etiketli)
  const allIssues = [
    ...(issues.critical || []).map((i: any) => ({ ...i, severity: 'critical' })),
    ...(issues.major || []).map((i: any) => ({ ...i, severity: 'major' })),
    ...(issues.minor || []).map((i: any) => ({ ...i, severity: 'minor' })),
    ...(issues.formatting || []).map((i: any) => ({ ...i, severity: 'formatting' })),
  ];
  const issueCount = allIssues.length;

  // öncelikli kartlar: kritik + önemli, ilk 3
  const topActions = allIssues.filter((i) => i.severity === 'critical' || i.severity === 'major').slice(0, 3);
  const topCritical = allIssues.find((i) => i.severity === 'critical') || topActions[0] || null;

  const verdict = buildVerdict(applicableCats, topCritical, grade.letter, overallScore)
    || result.executiveSummary || result.summary || '';

  const filteredIssues = issueFilter === 'all' ? allIssues : allIssues.filter((i) => i.severity === issueFilter);
  const weakest = applicableCats[applicableCats.length - 1];
  const strongest = applicableCats[0];

  // hangi sorunlar gösterilecek (öncelikli ↔ tümü-filtreli)
  const visibleIssues = showAllIssues ? filteredIssues : topActions;

  // not halkası (SVG progress ring) — r=52, çevre ≈ 326
  const RING_C = 326;
  const ringOffset = RING_C - (RING_C * overallScore) / 100;

  // tek bir kanıtlı kart (öncelikli ve tüm-sorunlar görünümünde ortak)
  const IssueCard = ({ issue, index }: { issue: any; index: number }) => {
    const m = sevMeta(issue.severity);
    const num = String(index + 1).padStart(2, '0');
    return (
      <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 sm:p-7 flex gap-4 items-start">
        <span
          className="font-serif text-2xl font-semibold leading-none flex-none w-8"
          style={{ color: m.col }}
        >
          {num}
        </span>
        <div className="flex-1 min-w-0">
          {/* header row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-[10.5px] font-extrabold tracking-[0.07em]" style={{ color: m.col }}>{m.label}</span>
                <span className="w-1 h-1 rounded-full bg-ink/20" />
                <span className="text-xs font-semibold text-ink/55">{issue.category || issue.cat || issue.location || ''}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink leading-snug tracking-[-0.01em]">{issue.title}</h3>
            </div>
            {issue.pageNumber ? (
              <span className="flex-none inline-flex items-center gap-1.5 text-xs font-bold text-ink/65 bg-paper-cool border border-line-cool px-2.5 py-1.5 rounded-full">
                <MapPin className="h-3 w-3" /> s.{issue.pageNumber}
              </span>
            ) : null}
          </div>

          {issue.description && (
            <p className="text-[15px] leading-relaxed text-ink/80 m-0">{issue.description}</p>
          )}

          {issue.originalText ? (
            <div className="mt-4 pl-4 border-l-[3px] border-line-cool">
              <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-ink/40 mb-1">
                Tezinden{issue.pageNumber ? `, s.${issue.pageNumber}` : ''}
              </div>
              <p className="font-serif italic text-[15.5px] leading-snug text-ink/65 m-0">&ldquo;{issue.originalText}&rdquo;</p>
            </div>
          ) : null}

          {issue.actionHint ? (
            <div className="mt-4 bg-primary-50 rounded-lg px-4 py-3.5 flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center mt-0.5">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.6} />
              </span>
              <div>
                <div className="text-[10.5px] font-extrabold tracking-[0.07em] uppercase text-primary-700 mb-0.5">Çözüm</div>
                <p className="text-[14.5px] leading-snug text-primary-900 m-0">{issue.actionHint}</p>
                {issue.suggestion ? (
                  <p className="text-[12.5px] leading-snug text-[#5b8a6d] mt-1.5 mb-0">
                    <b className="font-bold">Beklenen biçim:</b> {issue.suggestion}
                  </p>
                ) : null}
              </div>
            </div>
          ) : issue.suggestion ? (
            <div className="mt-3 text-xs text-ink/60 bg-paper-cool rounded-lg px-3 py-2">
              <span className="font-semibold">Beklenen kriter:</span> {issue.suggestion}
            </div>
          ) : null}

          {documentId && issue.rubricItemId ? (
            <div className="mt-3 flex justify-end">
              <RubricFeedbackButton documentId={documentId} rubricItemId={issue.rubricItemId} />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 sm:gap-9">
      {/* ============ TEZ DEĞİL UYARISI (belge-türü kapısı) ============ */}
      {notThesisFormat && (
        <div className="bg-[#fdf0d8] border border-[#f0d9a8] rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#b45309] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-ink text-[15px]">Bu belge akademik tez formatında görünmüyor</p>
            <p className="text-sm text-ink/70 mt-1 leading-relaxed">
              Yüklediğin belge bir <b>{docTypeLabel}</b> olarak değerlendirildi. Aşağıdaki puan ve not akademik
              tez rubriğine göre verildiği için bu belge türünde <b>düşük ve yanıltıcıdır</b> — tez notu burada
              anlamlı değildir. Yapısal ve biçimsel geri bildirimleri yine de inceleyebilirsin; gerçek tezini
              yüklersen sağlıklı bir değerlendirme alırsın.
            </p>
          </div>
        </div>
      )}
      {/* ============ KISMİ YÜKLEME UYARISI ============ */}
      {likelyPartialUpload && (
        <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#b45309] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-ink text-sm">Bu yükleme tam bir tez olmayabilir</p>
            <p className="text-sm text-ink/70 mt-0.5">Kapak, özet, içindekiler veya kaynakça gibi temel bölümlerin çoğu tespit edilemedi. Yalnızca bir bölüm ya da taslak yüklediyseniz sonuçlar tezinizin tamamını yansıtmayabilir.</p>
          </div>
        </div>
      )}
      {/* ============ TEORİK TEZ NOTU ============ */}
      {studyType === 'theoretical' && (
        <div className="bg-primary-50 border border-line-cool rounded-xl px-5 py-3 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary-900">Bu tez <b>teorik/derleme</b> türünde değerlendirildi. Örneklem, veri toplama ve istatistiksel test gibi yalnızca empirik çalışmalara özgü kriterler bu türde uygulanmadı; genel notunuz bu kriterlerden etkilenmedi.</p>
        </div>
      )}

      {/* ============ HERO: KARAR KARTI ============ */}
      <div>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#14224f] to-[#2a52a8] rounded-xl shadow-[0_30px_60px_-34px_rgba(20,34,79,0.55)] p-8 sm:p-9 mb-4">
          <div className="pointer-events-none absolute -top-32 -right-24 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(150,178,236,0.20),transparent_70%)]" />
          <div className="relative z-10 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase text-[#9db8f0] mb-5">
            <Scale className="w-4 h-4" /> Jüri değerlendirmesi
          </div>

          <div className="relative z-10 flex gap-8 sm:gap-10 items-center flex-wrap">
            {/* not halkası (SVG progress ring) */}
            <div className="flex-none relative w-[168px] h-[168px]">
              <svg width="168" height="168" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#9db8f0" strokeWidth="7" strokeLinecap="round"
                  transform="rotate(-90 60 60)" strokeDasharray={RING_C} strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-[58px] font-semibold leading-[0.9] text-[#eef2fb]">{grade.letter}</span>
                <span className="font-serif text-lg font-medium text-[#c6d1ec] mt-1">{overallScore}<span className="text-[13px] text-[#8a98c0]"> / 100</span></span>
              </div>
            </div>
            {/* headline (label) + verdict */}
            <div className="flex-1 min-w-[300px]">
              {grade.label && (
                <div className="font-serif font-medium text-2xl sm:text-3xl leading-tight tracking-[-0.015em] mb-3.5 text-[#f4f9f6]">{grade.label}</div>
              )}
              <p className="text-[15px] sm:text-[16.5px] leading-relaxed text-[#c2cbe6] m-0">{verdict}</p>
            </div>
          </div>
        </div>

        {/* at-a-glance row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-line-cool rounded-xl px-4 py-4 flex items-center gap-3">
            <span className="w-[42px] h-[42px] flex-none rounded-full bg-[#fdebef] flex items-center justify-center font-serif text-xl font-semibold text-[#be123c]">{(issues.critical || []).length}</span>
            <div><div className="text-sm font-bold text-ink">kritik sorun</div><div className="text-[12.5px] text-ink/55">önce bunları düzelt</div></div>
          </div>
          <div className="bg-white border border-line-cool rounded-xl px-4 py-4 flex items-center gap-3">
            <span className="w-[42px] h-[42px] flex-none rounded-full bg-primary-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-700" strokeWidth={2.2} />
            </span>
            <div className="min-w-0"><div className="text-sm font-bold text-ink truncate">{strongest?.label || '-'}</div><div className="text-[12.5px] text-[#5b8a6d] font-semibold">en güçlü · {strongest?.score ?? 0}</div></div>
          </div>
          <div className="bg-white border border-line-cool rounded-xl px-4 py-4 flex items-center gap-3">
            <span className="w-[42px] h-[42px] flex-none rounded-full bg-[#fdf0d8] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#b45309]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0"><div className="text-sm font-bold text-ink truncate">{weakest?.label || '-'}</div><div className="text-[12.5px] text-[#a4762f] font-semibold">en zayıf · {weakest?.score ?? 0}</div></div>
          </div>
        </div>

        {/* thin stats — yalnızca GERÇEK alanlar: sayfa + kelime */}
        {(stats.pageCount != null || stats.wordCount != null) && (
          <div className="flex flex-wrap gap-x-8 gap-y-1 mt-[18px] pt-[18px] border-t border-line-cool">
            {stats.pageCount != null && <span className="text-[13.5px] text-ink/55">Sayfa <b className="text-ink font-bold">{stats.pageCount}</b></span>}
            {stats.wordCount != null && <span className="text-[13.5px] text-ink/55">Kelime <b className="text-ink font-bold">{Number(stats.wordCount).toLocaleString('tr-TR')}</b></span>}
          </div>
        )}
      </div>

      {/* ============ DÜZELTME ÖNERİLERİ ============ */}
      {topActions.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap">
            <h2 className="font-serif font-semibold text-2xl sm:text-[26px] tracking-[-0.015em] m-0 text-ink">
              {showAllIssues ? `Tüm sorunlar (${issueCount})` : 'Önce bunları düzelt'}
            </h2>
            {issueCount > topActions.length && (
              <button
                onClick={() => setShowAllIssues(!showAllIssues)}
                className="bg-transparent border-none cursor-pointer text-[13.5px] font-bold text-primary-700 py-1 inline-flex items-center gap-1.5 hover:underline"
              >
                {showAllIssues ? 'Öncelikleri göster' : `Tümünü gör (${issueCount})`}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[15px] text-ink/55 m-0 mb-5 leading-snug">
            Her madde tezinden bir kanıta dayanır ve nasıl düzelteceğini söyler.
          </p>

          {/* filtreler — yalnız tümü görünümünde */}
          {showAllIssues && (
            <div className="flex flex-wrap gap-2 mb-5">
              {([
                ['all', `Tümü (${issueCount})`],
                ['critical', `Kritik (${(issues.critical || []).length})`],
                ['major', `Önemli (${(issues.major || []).length})`],
                ['minor', `Küçük (${(issues.minor || []).length})`],
                ['formatting', `Biçim (${(issues.formatting || []).length})`],
              ] as const).map(([key, label]) => {
                const active = issueFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setIssueFilter(key as any)}
                    className={`cursor-pointer text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${active ? 'bg-ink text-white border-ink' : 'bg-transparent text-ink/65 border-line-cool hover:border-ink/30'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {visibleIssues.length === 0
              ? <p className="text-center text-ink/40 py-6">Bu kategoride sorun yok.</p>
              : visibleIssues.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}
          </div>
        </div>
      )}

      {/* ============ KATEGORİLER (sıralı bar, tıkla-aç) ============ */}
      {sortedCats.length > 0 && (
        <div>
          <h2 className="font-serif font-semibold text-2xl sm:text-[26px] tracking-[-0.015em] m-0 mb-1.5 text-ink">Kategoriler, tek bakışta</h2>
          <p className="text-[15px] text-ink/55 m-0 mb-5">Bir kategoriye dokun, güçlü yanları ve geliştirme notlarını gör.</p>
          <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] px-6 sm:px-7 py-2">
            {sortedCats.map((c, idx) => {
              const open = expandedCats.has(c.key);
              const hasDetail = (c.data?.strengths?.length || 0) + (c.data?.improvements?.length || 0) > 0;
              const isLast = idx === sortedCats.length - 1;
              // Bu tez türünde uygulanmayan kategori: puan/bar yerine "Uygulanamaz".
              if (!c.applicable) {
                return (
                  <div key={c.key} className={`flex items-center gap-4 py-3.5 ${isLast ? '' : 'border-b border-[#f3f1ea]'} opacity-60`}>
                    <span className="w-[180px] flex-none text-[14.5px] font-semibold text-ink/45 text-left">{c.label}</span>
                    <span className="flex-1 text-xs text-ink/40 italic">Bu tez türünde uygulanmadı</span>
                    <span className="text-[11px] font-medium text-ink/40 bg-paper-cool px-2 py-0.5 rounded flex-none">Uygulanamaz</span>
                  </div>
                );
              }
              return (
                <div key={c.key} className={isLast ? '' : 'border-b border-[#f3f1ea]'}>
                  <button
                    onClick={() => hasDetail && toggleCat(c.key)}
                    className={`w-full flex items-center gap-4 bg-transparent border-none py-3.5 text-left ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="w-[180px] flex-none text-[14.5px] font-semibold text-ink/90 text-left">{c.label}</span>
                    <span className="flex-1 h-2 bg-[#efece3] rounded-full overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${c.score}%`, background: scoreBar(c.score) }} />
                    </span>
                    <span className="font-serif text-lg font-semibold w-8 text-right" style={{ color: scoreCol(c.score) }}>{c.score}</span>
                    <span className="w-3.5 flex-none text-[#bcb8aa]">
                      {hasDetail && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />}
                    </span>
                  </button>
                  {open && (
                    <div className="pl-[18px] pb-4 mb-1 border-l-2 border-primary-50 flex flex-col gap-2.5">
                      {(c.data?.strengths || []).map((s: string, i: number) => (
                        <div key={`s${i}`} className="flex items-start gap-2.5 text-sm text-ink/80 leading-snug">
                          <CheckCircle className="h-[15px] w-[15px] text-[#15803d] mt-0.5 flex-none" strokeWidth={2.5} />{s}
                        </div>
                      ))}
                      {(c.data?.improvements || []).map((s: string, i: number) => (
                        <div key={`i${i}`} className="flex items-start gap-2.5 text-sm text-ink/80 leading-snug">
                          <Lightbulb className="h-[15px] w-[15px] text-[#b45309] mt-0.5 flex-none" strokeWidth={2.2} />{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ GÜÇLÜ YÖNLER + YÖK (yan yana) ============ */}
      {(strengths.length > 0 || yok.compliant?.length > 0 || yok.nonCompliant?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Güçlü yönler */}
          {strengths.length > 0 && (
            <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] px-6 sm:px-7 py-6">
              <h2 className="font-serif font-semibold text-lg tracking-[-0.01em] m-0 mb-4 text-ink flex items-center gap-2.5">
                <Star className="h-[17px] w-[17px] text-[#15803d]" strokeWidth={2} /> Güçlü yanların
              </h2>
              <div className="flex flex-col gap-3">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-ink/90">
                    <Check className="h-4 w-4 text-[#15803d] mt-0.5 flex-none" strokeWidth={2.4} />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YÖK uyumu — yalnızca veri varsa */}
          {(yok.compliant?.length > 0 || yok.nonCompliant?.length > 0) && (
            <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] px-6 sm:px-7 py-6">
              <button onClick={() => setShowYok(!showYok)} className="w-full bg-transparent border-none cursor-pointer p-0 flex items-center justify-between gap-3">
                <h2 className="font-serif font-semibold text-lg tracking-[-0.01em] m-0 text-ink flex items-center gap-2.5">
                  <Shield className="h-[17px] w-[17px] text-primary-700" strokeWidth={2} /> YÖK uyumu
                </h2>
                <ChevronDown className={`h-5 w-5 text-[#bcb8aa] transition-transform ${showYok ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex items-center gap-3 mt-4 mb-1">
                <span className="flex-1 h-2 bg-[#efece3] rounded-full overflow-hidden">
                  <span className="block h-full rounded-full bg-primary-700" style={{ width: `${yok.score}%` }} />
                </span>
                <span className="font-serif text-xl font-semibold text-primary-700">%{yok.score}</span>
              </div>
              {showYok && (
                <div className="flex flex-col gap-2 mt-4">
                  {(yok.compliant || []).map((it: string, i: number) => (
                    <div key={`c${i}`} className="flex items-start gap-2.5 text-[13.5px] text-ink/90 leading-snug">
                      <Check className="h-[15px] w-[15px] text-[#15803d] mt-0.5 flex-none" strokeWidth={2.5} />{it}
                    </div>
                  ))}
                  {(yok.nonCompliant || []).map((it: string, i: number) => (
                    <div key={`n${i}`} className="flex items-start gap-2.5 text-[13.5px] text-[#8f1d38] leading-snug">
                      <X className="h-[15px] w-[15px] text-[#be123c] mt-0.5 flex-none" strokeWidth={2.5} />{it}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ META — analiz tarihi (süre YOK) ============ */}
      <div className="text-center text-[12.5px] text-ink/40">
        Analiz: {new Date(result.metadata?.analyzedAt || Date.now()).toLocaleString('tr-TR')}
        {' · '}Rubrik temelli, deterministik değerlendirme
      </div>
    </div>
  );
}
