'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Star,
  Target,
  BookOpen,
  PenTool,
  Quote,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PremiumResultDisplay from '@/app/components/PremiumResultDisplay';
import toast from 'react-hot-toast';

interface CategoryScore {
  score: number;
  feedback: string;
}

interface Issue {
  title: string;
  description: string;
  impact: string;
  solution: string;
  example?: string;
}

interface AnalysisResult {
  overall_score: number;
  grade_category: string;
  summary: string;
  category_scores: {
    structure: CategoryScore;
    methodology: CategoryScore;
    writing_quality: CategoryScore;
    references: CategoryScore;
  };
  critical_issues: Issue[];
  major_issues: Issue[];
  minor_issues: Issue[];
  strengths: string[];
  immediate_actions: string[];
  recommendations: string[];
  metadata: {
    sections_found: string[];
    missing_sections: string[];
  };
  // Premium format properties
  sections?: any;
  yokCompliance?: any;
  priorityActions?: any;
}

interface ThesisDocument {
  id: string;
  filename: string;
  status: 'processing' | 'analyzed' | 'failed';
  overall_score: number | null;
  page_count: number;
  word_count: number;
  analysis_type: string;
  credits_used: number;
  created_at: string;
  analyzed_at: string | null;
  analysis_result: AnalysisResult | null;
}

interface AnalysisDetailContentProps {
  analysisId: string;
}

export default function AnalysisDetailContent({ analysisId }: AnalysisDetailContentProps) {
  const [analysis, setAnalysis] = useState<ThesisDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/auth');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('thesis_documents')
          .select('*')
          .eq('id', analysisId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Analiz bulunamadı');
          } else {
            setError('Analiz yüklenemedi');
          }
          return;
        }

        setAnalysis(data as ThesisDocument);
      } catch (err) {
        console.error('Error:', err);
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, supabase, router]);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    const t = toast.loading('PDF hazırlanıyor...');
    try {
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: analysisId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'PDF oluşturulamadı');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const safe =
        (analysis?.filename || 'rapor')
          .replace(/\.(pdf|docx)$/i, '')
          .replace(/[^\w.-]+/g, '_')
          .slice(0, 60) || 'rapor';
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `TezAI-${safe}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF indirildi', { id: t });
    } catch (e: any) {
      toast.error(e?.message || 'PDF indirilemedi', { id: t });
    } finally {
      setDownloading(false);
    }
  };

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-amber-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-700 bg-green-50';
    if (grade.startsWith('B')) return 'text-primary-700 bg-primary-50';
    if (grade.startsWith('C')) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure': return BookOpen;
      case 'methodology': return Target;
      case 'writing_quality': return PenTool;
      case 'references': return Quote;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'structure': return 'Yapı';
      case 'methodology': return 'Metodoloji';
      case 'writing_quality': return 'Yazım Kalitesi';
      case 'references': return 'Kaynaklar';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-cool flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-ink/60">Analiz yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-paper-cool flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-ink mb-2">{error || 'Analiz bulunamadı'}</h2>
          <p className="text-ink/50 mb-6">Aradığınız analiz mevcut değil veya erişim izniniz yok.</p>
          <Link
            href="/analyses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Analizlere Dön
          </Link>
        </div>
      </div>
    );
  }

  const result = analysis.analysis_result;

  // Premium format kontrolü (sections veya yokCompliance varsa yeni format)
  const isPremiumFormat = result && (result.sections || result.yokCompliance || result.priorityActions);

  return (
    <div className="min-h-screen bg-paper-cool">
      {/* Sayfa-içi alt başlık (global nav'ın altında) */}
      <div className="bg-white border-b border-line-cool">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/analyses"
              className="flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Analizlere dön</span>
            </Link>
            <h1 className="font-serif text-lg font-semibold text-ink truncate max-w-[40%] text-center hidden sm:block">{analysis.filename}</h1>
            {analysis.status === 'analyzed' ? (
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span>{downloading ? 'Hazırlanıyor…' : 'PDF indir'}</span>
              </button>
            ) : (
              <div className="w-28" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
        {/* Durum bandı: işleniyor / başarısız */}
        {analysis.status === 'processing' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mr-4 flex-none" />
              <div>
                <h3 className="font-semibold text-amber-800">Analiz devam ediyor</h3>
                <p className="text-amber-700/90 text-sm">Teziniz analiz ediliyor. Tamamlandığında bu sayfa otomatik olarak güncellenecektir.</p>
              </div>
            </div>
          </div>
        )}

        {analysis.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-4 flex-none" />
              <div>
                <h3 className="font-semibold text-red-800">Analiz başarısız</h3>
                <p className="text-red-700/90 text-sm">Teziniz analiz edilirken bir hata oluştu. Kredileriniz iade edildi.</p>
              </div>
            </div>
          </div>
        )}

        {/* Premium format — ana sonuç gösterimi */}
        {isPremiumFormat && result && (
          <PremiumResultDisplay result={result as any} documentId={analysisId} />
        )}

        {/* Eski format için yedek gösterim */}
        {!isPremiumFormat && result && (
          <>
            {/* Genel bakış */}
            <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="font-serif text-2xl font-semibold text-ink mb-2">{analysis.filename}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{analysis.page_count} sayfa</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{analysis.word_count?.toLocaleString('tr-TR')} kelime</span>
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(analysis.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="bg-paper-cool text-ink/60 px-2 py-1 rounded">
                      {analysis.analysis_type === 'basic' ? 'Kısa Tez' : analysis.analysis_type === 'standard' ? 'Standart Tez' : 'Uzun Tez'} Analizi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-center px-6 py-4 rounded-xl ${getScoreBgColor(result.overall_score)}`}>
                    <div className={`font-serif text-4xl font-bold ${getScoreColor(result.overall_score)}`}>{result.overall_score}</div>
                    <div className="text-sm text-ink/50">/ 100</div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${getGradeColor(result.grade_category)}`}>Not: {result.grade_category}</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-line-cool">
                <h3 className="font-semibold text-ink mb-2">Özet</h3>
                <p className="text-ink/70">{result.summary}</p>
              </div>
            </div>

            {/* Kategori puanları */}
            <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
              <h3 className="font-serif text-lg font-semibold text-ink mb-6">Kategori puanları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.category_scores).map(([category, data]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="bg-paper-cool rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-primary-600 mr-2" />
                          <span className="font-medium text-ink">{getCategoryLabel(category)}</span>
                        </div>
                        <span className={`text-xl font-bold ${getScoreColor(data.score)}`}>{data.score}/100</span>
                      </div>
                      <div className="w-full bg-line-cool rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full ${data.score >= 80 ? 'bg-green-600' : data.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <p className="text-sm text-ink/60">{data.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sorunlar */}
            {(result.critical_issues.length > 0 || result.major_issues.length > 0 || result.minor_issues.length > 0) && (
              <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
                <h3 className="font-serif text-lg font-semibold text-ink mb-6">Bulunan sorunlar</h3>
                {result.critical_issues.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4"><XCircle className="h-5 w-5 text-red-600 mr-2" /><h4 className="font-semibold text-red-700">Kritik sorunlar ({result.critical_issues.length})</h4></div>
                    <div className="space-y-3">
                      {result.critical_issues.map((issue, index) => (
                        <IssueCard key={`critical-${index}`} issue={issue} type="critical" isExpanded={expandedIssues.has(`critical-${index}`)} onToggle={() => toggleIssue(`critical-${index}`)} />
                      ))}
                    </div>
                  </div>
                )}
                {result.major_issues.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4"><AlertTriangle className="h-5 w-5 text-amber-600 mr-2" /><h4 className="font-semibold text-amber-700">Önemli sorunlar ({result.major_issues.length})</h4></div>
                    <div className="space-y-3">
                      {result.major_issues.map((issue, index) => (
                        <IssueCard key={`major-${index}`} issue={issue} type="major" isExpanded={expandedIssues.has(`major-${index}`)} onToggle={() => toggleIssue(`major-${index}`)} />
                      ))}
                    </div>
                  </div>
                )}
                {result.minor_issues.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4"><Info className="h-5 w-5 text-primary-600 mr-2" /><h4 className="font-semibold text-primary-700">Küçük sorunlar ({result.minor_issues.length})</h4></div>
                    <div className="space-y-3">
                      {result.minor_issues.map((issue, index) => (
                        <IssueCard key={`minor-${index}`} issue={issue} type="minor" isExpanded={expandedIssues.has(`minor-${index}`)} onToggle={() => toggleIssue(`minor-${index}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Güçlü yönler */}
            {result.strengths.length > 0 && (
              <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
                <div className="flex items-center mb-4"><Star className="h-5 w-5 text-green-600 mr-2" /><h3 className="font-serif text-lg font-semibold text-ink">Güçlü yönler</h3></div>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start"><CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" /><span className="text-ink/80">{strength}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acil aksiyonlar */}
            {result.immediate_actions.length > 0 && (
              <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
                <div className="flex items-center mb-4"><Zap className="h-5 w-5 text-amber-600 mr-2" /><h3 className="font-serif text-lg font-semibold text-ink">Acil aksiyonlar</h3></div>
                <ul className="space-y-2">
                  {result.immediate_actions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-amber-100 text-amber-700 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">{index + 1}</div>
                      <span className="text-ink/80">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Öneriler */}
            {result.recommendations.length > 0 && (
              <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 mb-8">
                <div className="flex items-center mb-4"><Lightbulb className="h-5 w-5 text-primary-600 mr-2" /><h3 className="font-serif text-lg font-semibold text-ink">Öneriler</h3></div>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start"><div className="bg-primary-200 w-2 h-2 rounded-full mr-3 flex-shrink-0 mt-2" /><span className="text-ink/80">{rec}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Belge yapısı */}
            {result.metadata && (
              <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6">
                <h3 className="font-serif text-lg font-semibold text-ink mb-4">Belge yapısı</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.metadata.sections_found?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-ink/70 mb-2 flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2" />Bulunan bölümler</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.metadata.sections_found.map((section, index) => (
                          <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{section}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.metadata.missing_sections?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-ink/70 mb-2 flex items-center"><AlertCircle className="h-4 w-4 text-red-500 mr-2" />Eksik bölümler</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.metadata.missing_sections.map((section, index) => (
                          <span key={index} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">{section}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tekrar analiz köprüsü — yalnız tamamlanmış raporlarda */}
        {analysis.status === 'analyzed' && (
          <div className="mt-8 bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 sm:p-8 text-center">
            <h3 className="font-serif text-lg font-semibold text-ink mb-1">Eksikleri düzelttin mi?</h3>
            <p className="text-sm text-ink/55 mb-4 max-w-xl mx-auto leading-relaxed">
              Rapordaki önerileri uygula, gözden geçirilmiş tezini tekrar analiz et. Her tur, tezini jüri ve YÖK standartlarına biraz daha yaklaştırır.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              <TrendingUp className="h-5 w-5" />
              Tezini tekrar analiz et
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Sorun kartı (eski format)
function IssueCard({
  issue,
  type,
  isExpanded,
  onToggle
}: {
  issue: Issue;
  type: 'critical' | 'major' | 'minor';
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const bgColor = type === 'critical' ? 'bg-red-50 border-red-200' :
                  type === 'major' ? 'bg-amber-50 border-amber-200' :
                  'bg-primary-50 border-primary-100';

  return (
    <div className={`border rounded-lg ${bgColor}`}>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-left">
        <span className="font-medium text-ink">{issue.title}</span>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-ink/40" /> : <ChevronDown className="h-5 w-5 text-ink/40" />}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div><p className="text-sm font-medium text-ink/70">Açıklama:</p><p className="text-sm text-ink/60">{issue.description}</p></div>
          <div><p className="text-sm font-medium text-ink/70">Etki:</p><p className="text-sm text-ink/60">{issue.impact}</p></div>
          <div><p className="text-sm font-medium text-ink/70">Çözüm:</p><p className="text-sm text-ink/60">{issue.solution}</p></div>
          {issue.example && (
            <div><p className="text-sm font-medium text-ink/70">Örnek:</p><p className="text-sm text-ink/60 bg-white/60 p-2 rounded">{issue.example}</p></div>
          )}
        </div>
      )}
    </div>
  );
}
