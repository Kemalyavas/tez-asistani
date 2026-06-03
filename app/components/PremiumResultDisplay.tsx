'use client';

import { useState } from 'react';
import {
  CheckCircle, AlertTriangle, AlertCircle, XCircle, ChevronDown, FileText,
  PenTool, Quote, Layout, Target, Award, TrendingUp, MapPin, Lightbulb,
  Shield, BarChart3, BookOpen, Scale,
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

function sectionIcon(key: string) {
  const cls = 'h-4 w-4';
  switch (key) {
    case 'formatting': return <FileText className={cls} />;
    case 'structure': return <Layout className={cls} />;
    case 'introduction': return <MapPin className={cls} />;
    case 'literature': return <BookOpen className={cls} />;
    case 'methodology': return <Target className={cls} />;
    case 'findings': return <BarChart3 className={cls} />;
    case 'discussion': return <Lightbulb className={cls} />;
    case 'conclusion': return <Award className={cls} />;
    case 'originality': return <TrendingUp className={cls} />;
    case 'writingQuality': return <PenTool className={cls} />;
    case 'references': return <Quote className={cls} />;
    default: return <FileText className={cls} />;
  }
}

// score → renk paleti
function scoreBar(s: number) {
  if (s >= 85) return 'bg-emerald-500';
  if (s >= 70) return 'bg-lime-500';
  if (s >= 55) return 'bg-amber-400';
  if (s >= 40) return 'bg-orange-400';
  return 'bg-rose-400';
}
function scoreText(s: number) {
  if (s >= 85) return 'text-emerald-600';
  if (s >= 70) return 'text-lime-600';
  if (s >= 55) return 'text-amber-600';
  if (s >= 40) return 'text-orange-600';
  return 'text-rose-500';
}

// severity meta
function sevBadge(sev: string) {
  switch (sev) {
    case 'critical': return { label: 'KRİTİK', cls: 'text-rose-600 bg-rose-100', strip: 'bg-rose-500', ring: 'ring-rose-200' };
    case 'major': return { label: 'ÖNEMLİ', cls: 'text-amber-700 bg-amber-100', strip: 'bg-amber-400', ring: 'ring-amber-200' };
    case 'minor': return { label: 'KÜÇÜK', cls: 'text-yellow-700 bg-yellow-100', strip: 'bg-yellow-400', ring: 'ring-yellow-200' };
    default: return { label: 'FORMAT', cls: 'text-blue-700 bg-blue-100', strip: 'bg-blue-400', ring: 'ring-blue-200' };
  }
}
function sevIcon(sev: string) {
  switch (sev) {
    case 'critical': return <XCircle className="h-5 w-5 text-rose-500" />;
    case 'major': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'minor': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    default: return <Layout className="h-5 w-5 text-blue-500" />;
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
  const grade = result.grade || { letter: 'B', label: 'Orta', color: '#FBBF24' };
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
  const strongCount = applicableCats.filter((c) => c.score >= 85).length;
  const weakest = applicableCats[applicableCats.length - 1];
  const refCount = stats.referenceCount ?? 0;
  const figTab = (stats.figureCount ?? 0) + (stats.tableCount ?? 0);

  // tek bir kanıtlı kart (öncelikli ve tüm-sorunlar görünümünde ortak)
  const IssueCard = ({ issue }: { issue: any }) => {
    const b = sevBadge(issue.severity);
    return (
      <div className={`bg-white rounded-2xl shadow-sm ring-1 ${b.ring} overflow-hidden`}>
        <div className="flex items-stretch">
          <div className={`w-1.5 ${b.strip}`} />
          <div className="flex-1 p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${b.cls}`}>{b.label}</span>
                <h3 className="font-bold text-slate-900">{issue.title}</h3>
                {issue.location && <span className="text-xs text-slate-400">{issue.location}</span>}
              </div>
              {issue.pageNumber ? (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                  <MapPin className="h-3 w-3" /> Sayfa {issue.pageNumber}
                </span>
              ) : null}
            </div>
            {issue.description && <p className="text-sm text-slate-700 leading-relaxed">{issue.description}</p>}
            {issue.originalText ? (
              <div className="mt-3 bg-slate-50 border-l-2 border-slate-300 rounded-r px-3 py-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Tezinden</div>
                <p className="text-sm italic text-slate-600">&quot;{issue.originalText}&quot;</p>
              </div>
            ) : null}
            {issue.actionHint ? (
              <div className="mt-3 bg-emerald-50 border-l-2 border-emerald-400 rounded-r px-3 py-2">
                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Ne yapmalısın
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">{issue.actionHint}</p>
              </div>
            ) : null}
            {issue.suggestion ? (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ============ KISMİ YÜKLEME UYARISI ============ */}
      {likelyPartialUpload && (
        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Bu yükleme tam bir tez olmayabilir</p>
            <p className="text-sm text-amber-700 mt-0.5">Kapak, özet, içindekiler veya kaynakça gibi temel bölümlerin çoğu tespit edilemedi. Yalnızca bir bölüm ya da taslak yüklediyseniz sonuçlar tezinizin tamamını yansıtmayabilir.</p>
          </div>
        </div>
      )}
      {/* ============ TEORİK TEZ NOTU ============ */}
      {studyType === 'theoretical' && (
        <div className="bg-sky-50 ring-1 ring-sky-200 rounded-2xl px-5 py-3 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-sky-800">Bu tez <b>teorik/derleme</b> türünde değerlendirildi. Örneklem, veri toplama ve istatistiksel test gibi yalnızca empirik çalışmalara özgü kriterler bu türde uygulanmadı; genel notunuz bu kriterlerden etkilenmedi.</p>
        </div>
      )}
      {/* ============ HERO: KARAR KARTI ============ */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
          {/* Not halkası */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(${grade.color} 0 ${overallScore}%, #e5e7eb ${overallScore}% 100%)` }}
            >
              <div className="w-[100px] h-[100px] bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold leading-none" style={{ color: grade.color }}>{grade.letter}</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5">{overallScore}<span className="text-slate-400 text-xs">/100</span></span>
              </div>
            </div>
            <span className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: grade.color, backgroundColor: grade.color + '1A' }}>{grade.label}</span>
          </div>
          {/* Jüri hükmü */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1.5">
              <Scale className="w-4 h-4" /> Jüri Değerlendirmesi
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700">{verdict}</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-rose-50 rounded-xl px-3 py-2.5 text-center">
                <div className="text-xl font-bold text-rose-600">{(issues.critical || []).length}</div>
                <div className="text-[11px] text-rose-500 font-medium">kritik sorun</div>
              </div>
              <div className="bg-emerald-50 rounded-xl px-3 py-2.5 text-center">
                <div className="text-sm font-bold text-emerald-600 leading-tight mt-0.5 truncate">{applicableCats[0]?.label || '-'}</div>
                <div className="text-[11px] text-emerald-500 font-medium">en güçlü ({applicableCats[0]?.score ?? 0})</div>
              </div>
              <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                <div className="text-sm font-bold text-amber-600 leading-tight mt-0.5 truncate">{weakest?.label || '-'}</div>
                <div className="text-[11px] text-amber-500 font-medium">en zayıf ({weakest?.score ?? 0})</div>
              </div>
            </div>
          </div>
        </div>
        {/* Güvenilir istatistik şeridi */}
        <div className="border-t border-slate-100 px-6 sm:px-8 py-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
          {stats.pageCount != null && <span className="text-slate-500">Sayfa: <b className="text-slate-800">{stats.pageCount}</b></span>}
          {stats.wordCount != null && <span className="text-slate-500">Kelime: <b className="text-slate-800">{Number(stats.wordCount).toLocaleString('tr-TR')}</b></span>}
          {refCount > 0 && <span className="text-slate-500">Kaynak: <b className="text-slate-800">{refCount}</b></span>}
          {figTab > 0 && <span className="text-slate-500">Şekil/Tablo: <b className="text-slate-800">{figTab}</b></span>}
        </div>
      </div>

      {/* ============ ÖNCE BUNLARI DÜZELT ============ */}
      {topActions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-rose-500 rounded-full" /> Önce bunları düzelt
            <span className="text-xs font-medium text-slate-400">en yüksek etkili {topActions.length} madde</span>
          </h2>
          <p className="text-sm text-slate-500 mb-4">Her maddede tezinden bir kanıt ve karşılanması beklenen kriter var.</p>
          <div className="space-y-4">
            {topActions.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
          {issueCount > topActions.length && !showAllIssues && (
            <button
              onClick={() => setShowAllIssues(true)}
              className="mt-4 w-full text-sm font-medium text-slate-500 bg-white ring-1 ring-slate-200 rounded-xl py-2.5 hover:bg-slate-50"
            >
              Kalan {issueCount - topActions.length} sorunu göster
            </button>
          )}
        </div>
      )}

      {/* ============ TÜM SORUNLAR (filtreli, isteğe bağlı) ============ */}
      {showAllIssues && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-slate-400 rounded-full" /> Tüm sorunlar ({issueCount})
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ['all', `Tümü (${issueCount})`],
              ['critical', `Kritik (${(issues.critical || []).length})`],
              ['major', `Önemli (${(issues.major || []).length})`],
              ['minor', `Küçük (${(issues.minor || []).length})`],
              ['formatting', `Format (${(issues.formatting || []).length})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setIssueFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm ${issueFilter === key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredIssues.length === 0
              ? <p className="text-center text-slate-400 py-6">Bu kategoride sorun yok.</p>
              : filteredIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
        </div>
      )}

      {/* ============ 10 KATEGORİ (sıralı bar, tıkla-aç) ============ */}
      {sortedCats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-500 rounded-full" /> Kategoriler, tek bakışta
          </h2>
          <div className="space-y-2">
            {sortedCats.map((c) => {
              const open = expandedCats.has(c.key);
              const hasDetail = (c.data?.strengths?.length || 0) + (c.data?.improvements?.length || 0) > 0;
              // Bu tez türünde uygulanmayan kategori: puan/bar yerine "Uygulanamaz".
              if (!c.applicable) {
                return (
                  <div key={c.key} className="flex items-center gap-3 py-2 px-1 opacity-70">
                    <span className="flex items-center gap-1.5 w-40 flex-shrink-0 text-sm text-slate-400 text-left">
                      <span className="text-slate-300">{sectionIcon(c.key)}</span>{c.label}
                    </span>
                    <span className="flex-1 text-xs text-slate-400 italic">Bu tez türünde uygulanmadı</span>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">Uygulanamaz</span>
                  </div>
                );
              }
              return (
                <div key={c.key} className="rounded-lg">
                  <button
                    onClick={() => hasDetail && toggleCat(c.key)}
                    className={`w-full flex items-center gap-3 py-2 px-1 rounded-lg ${hasDetail ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="flex items-center gap-1.5 w-40 flex-shrink-0 text-sm text-slate-600 text-left">
                      <span className="text-slate-400">{sectionIcon(c.key)}</span>{c.label}
                    </span>
                    <span className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <span className={`block h-2 rounded-full ${scoreBar(c.score)}`} style={{ width: `${c.score}%` }} />
                    </span>
                    <span className={`text-sm font-bold w-9 text-right ${scoreText(c.score)}`}>{c.score}</span>
                    {hasDetail && <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
                  </button>
                  {open && (
                    <div className="ml-1 pl-3 border-l-2 border-slate-100 pb-3 pt-1 space-y-2">
                      {(c.data?.strengths || []).map((s: string, i: number) => (
                        <p key={`s${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{s}
                        </p>
                      ))}
                      {(c.data?.improvements || []).map((s: string, i: number) => (
                        <p key={`i${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />{s}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ GÜÇLÜ YÖNLER ============ */}
      {strengths.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" /> Tezinin güçlü yanları
          </h2>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <span key={i} className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ============ YÖK UYUMLULUĞU ============ */}
      {(yok.compliant?.length > 0 || yok.nonCompliant?.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <button onClick={() => setShowYok(!showYok)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" /> YÖK Standartları Uyumluluğu
              <span className={`text-xs px-2 py-0.5 rounded-full ${yok.score >= 80 ? 'bg-emerald-100 text-emerald-700' : yok.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>%{yok.score}</span>
            </span>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showYok ? 'rotate-180' : ''}`} />
          </button>
          {showYok && (
            <div className="p-4 pt-0 grid sm:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-emerald-50">
                <h4 className="font-medium text-emerald-800 mb-2 text-sm flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Uyulan ({yok.compliant?.length || 0})</h4>
                <ul className="space-y-1.5">{(yok.compliant || []).map((it: string, i: number) => <li key={i} className="text-sm text-emerald-700">{it}</li>)}</ul>
              </div>
              <div className="border rounded-lg p-4 bg-rose-50">
                <h4 className="font-medium text-rose-800 mb-2 text-sm flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Eksik ({yok.nonCompliant?.length || 0})</h4>
                <ul className="space-y-1.5">{(yok.nonCompliant || []).map((it: string, i: number) => <li key={i} className="text-sm text-rose-700">{it}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ META ============ */}
      <div className="text-center text-xs text-slate-400">
        Analiz: {new Date(result.metadata?.analyzedAt || Date.now()).toLocaleString('tr-TR')}
        {' • '}
        Süre: {((result.metadata?.processingTimeMs || 0) / 1000).toFixed(1)} sn
      </div>
    </div>
  );
}
