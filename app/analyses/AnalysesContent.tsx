'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, ChevronRight, ChevronDown, Search, Filter, Loader2 } from 'lucide-react';

interface ThesisAnalysis {
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
}

type SortOption = 'newest' | 'oldest' | 'highest_score' | 'lowest_score';
type StatusFilter = 'all' | 'analyzed' | 'processing' | 'failed';

export default function AnalysesContent() {
  const [analyses, setAnalyses] = useState<ThesisAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('thesis_documents')
          .select('id, filename, status, overall_score, page_count, word_count, analysis_type, credits_used, created_at, analyzed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching analyses:', error);
          return;
        }

        setAnalyses(data as ThesisAnalysis[]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [supabase, router]);

  // Filter and sort analyses
  const filteredAnalyses = analyses
    .filter(analysis => {
      // Search filter
      if (searchQuery && !analysis.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && analysis.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest_score':
          return (b.overall_score ?? 0) - (a.overall_score ?? 0);
        case 'lowest_score':
          return (a.overall_score ?? 0) - (b.overall_score ?? 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Skordan harf notu türet (mockup gradeMeta renkleriyle uyumlu)
  const getGrade = (score: number) => {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const gradeMeta: Record<string, { color: string; bg: string }> = {
    A: { color: '#15803d', bg: '#e7f3ec' },
    B: { color: '#2f8f4e', bg: '#eaf3ed' },
    C: { color: '#a16207', bg: '#f7f0df' },
    D: { color: '#c2410c', bg: '#f8ece4' },
    F: { color: '#be123c', bg: '#fbe9ee' },
  };

  const getBarColor = (score: number) =>
    score >= 85 ? '#15803d' : score >= 70 ? '#65a30d' : score >= 55 ? '#ca8a04' : score >= 40 ? '#ea580c' : '#e11d48';

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'Kısa Tez';
      case 'standard': return 'Standart Tez';
      case 'comprehensive': return 'Uzun Tez';
      default: return type;
    }
  };

  const isStuckProcessing = (analysis: ThesisAnalysis) => {
    if (analysis.status !== 'processing') return false;
    const ageMs = Date.now() - new Date(analysis.created_at).getTime();
    return ageMs > 15 * 60 * 1000; // 15 minutes
  };

  const handleMarkFailed = async (analysisId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setActionLoadingId(analysisId);
      const response = await fetch('/api/analyze/mark-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId: analysisId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setAnalyses(prev => prev.map(a =>
        a.id === analysisId ? { ...a, status: 'failed' } : a
      ));

      toast.success(data.refunded ? 'Başarısız işaretlendi ve krediler iade edildi.' : 'Başarısız işaretlendi.');
    } catch (error: any) {
      toast.error(error.message || 'Analiz başarısız olarak işaretlenemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Özet metrikler (gerçek hesaplanan değerler)
  const completedCount = analyses.filter(a => a.status === 'analyzed').length;
  const scored = analyses.filter(a => a.overall_score !== null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, a) => sum + (a.overall_score || 0), 0) / scored.length)
    : null;

  const summary = [
    { label: 'Toplam analiz', value: analyses.length },
    { label: 'Ortalama skor', value: avgScore ?? '—' },
    { label: 'Tamamlanan', value: completedCount },
  ];

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'analyzed', label: 'Tamamlanan' },
    { key: 'processing', label: 'İşleniyor' },
    { key: 'failed', label: 'Başarısız' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-cool flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-ink/55">Analizleriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-cool">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ===== PAGE TITLE ===== */}
        <div className="flex items-end justify-between gap-5 flex-wrap mb-7">
          <div>
            <h1 className="font-serif font-medium text-4xl md:text-[42px] leading-[1.05] tracking-tight text-ink mb-2">
              Analizlerim
            </h1>
            <p className="text-base text-ink/55">Yüklediğin tezlerin değerlendirme geçmişi.</p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 text-white text-[15px] font-bold px-5 py-3 rounded-lg shadow-[0_12px_26px_-12px_rgba(30,58,138,0.9)] transition-all"
          >
            <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
            Yeni analiz
          </Link>
        </div>

        {/* ===== SUMMARY ===== */}
        <div className="reveal grid grid-cols-3 gap-3.5 mb-8">
          {summary.map((m) => (
            <div key={m.label} className="bg-white border border-line-cool rounded-lg px-5 py-[18px]">
              <div className="text-[12.5px] font-semibold text-ink/50 mb-2">{m.label}</div>
              <div className="font-serif text-3xl font-semibold text-ink leading-none">{m.value}</div>
            </div>
          ))}
        </div>

        {/* ===== FILTER ROW ===== */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filterOptions.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`cursor-pointer text-[13px] font-semibold px-[15px] py-[7px] rounded-full border transition-all ${
                  active
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink/55 border-line-cool hover:border-ink/30'
                }`}
              >
                {f.label}
              </button>
            );
          })}
          {/* Arama / sıralama aç-kapa */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-[15px] py-[7px] rounded-full border border-line-cool bg-white text-ink/55 hover:border-ink/30 transition-all"
          >
            <Filter className="h-3.5 w-3.5" />
            Ara / sırala
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1" />
          <span className="text-[13px] text-ink/50">{filteredAnalyses.length} analiz</span>
        </div>

        {/* Arama + sıralama paneli */}
        {showFilters && (
          <div className="reveal bg-white border border-line-cool rounded-xl p-4 mb-5 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
              <input
                type="text"
                placeholder="Dosya adına göre ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-paper-cool/60 border border-line-cool rounded-lg text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600/40"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3.5 py-2.5 text-sm bg-paper-cool/60 border border-line-cool rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600/40"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="highest_score">En Yüksek Puan</option>
              <option value="lowest_score">En Düşük Puan</option>
            </select>
          </div>
        )}

        {/* ===== LIST ===== */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white border border-line-cool rounded-xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-12 text-center">
            {analyses.length === 0 ? (
              <>
                <h3 className="font-serif text-xl font-semibold text-ink mb-2">Henüz analiz yok</h3>
                <p className="text-ink/55 mb-6">İlk tezini analiz ederek başla.</p>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Tez Analiz Et
                </Link>
              </>
            ) : (
              <>
                <h3 className="font-serif text-xl font-semibold text-ink mb-2">Eşleşen analiz bulunamadı</h3>
                <p className="text-ink/55">Aramanı veya filtreni değiştirmeyi dene.</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAnalyses.map((analysis) => {
              const isDone = analysis.status === 'analyzed' && analysis.overall_score !== null;
              const isProcessing = analysis.status === 'processing';
              const isFailed = analysis.status === 'failed';
              const score = analysis.overall_score ?? 0;
              const grade = isDone ? getGrade(score) : null;
              const gm = grade ? gradeMeta[grade] : null;

              return (
                <Link
                  key={analysis.id}
                  href={`/analyses/${analysis.id}`}
                  className="group bg-white border border-line-cool rounded-[9px] shadow-[0_14px_32px_-30px_rgba(20,28,55,0.4)] px-5 py-[18px] flex items-center gap-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-30px_rgba(20,28,55,0.45)] hover:border-[#cdd8d2]"
                >
                  {/* grade chip / spinner */}
                  <div
                    className="flex-none w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center"
                    style={{ background: isDone && gm ? gm.bg : isFailed ? gradeMeta.F.bg : '#eef0ee' }}
                  >
                    {isDone && gm ? (
                      <>
                        <span className="font-serif text-[26px] font-semibold leading-none" style={{ color: gm.color }}>
                          {grade}
                        </span>
                        <span className="text-[11px] font-bold opacity-80" style={{ color: gm.color }}>
                          {analysis.overall_score}
                        </span>
                      </>
                    ) : isProcessing ? (
                      <span className="w-6 h-6 rounded-full border-[2.5px] border-[#cbd5d0] border-t-primary-600 animate-spin" />
                    ) : (
                      <span className="font-serif text-[22px] font-semibold leading-none" style={{ color: gradeMeta.F.color }}>
                        !
                      </span>
                    )}
                  </div>

                  {/* main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-base font-bold text-ink truncate">{analysis.filename}</span>
                      <span
                        className="flex-none text-[11px] font-bold tracking-wide px-2.5 py-[3px] rounded-full"
                        style={{
                          color: isProcessing ? '#b45309' : isFailed ? '#be123c' : '#15803d',
                          background: isProcessing ? '#fef6e6' : isFailed ? '#fbe9ee' : '#e7f3ec',
                        }}
                      >
                        {isProcessing ? 'İşleniyor' : isFailed ? 'Başarısız' : 'Tamamlandı'}
                      </span>
                      {isProcessing && isStuckProcessing(analysis) && (
                        <button
                          onClick={(e) => handleMarkFailed(analysis.id, e)}
                          disabled={actionLoadingId === analysis.id}
                          className="flex-none text-[11px] font-semibold px-2.5 py-[3px] rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-60"
                        >
                          {actionLoadingId === analysis.id ? 'Güncelleniyor...' : 'Başarısız işaretle'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-ink/50 flex-wrap">
                      <span>{analysis.page_count} sayfa</span>
                      <span className="text-[#cdd5d0]">·</span>
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[#cdd5d0]">·</span>
                      <span>{getAnalysisTypeLabel(analysis.analysis_type)}</span>
                    </div>
                  </div>

                  {/* score bar (done only) */}
                  {isDone && (
                    <div className="flex-none w-[120px] hidden sm:block">
                      <div className="h-[7px] rounded-full bg-[#eef0ee] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ background: getBarColor(score), width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <ChevronRight className="flex-none h-[18px] w-[18px] text-[#b6c0ba] group-hover:text-primary-600 transition-colors" strokeWidth={2.2} />
                </Link>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {filteredAnalyses.length > 0 && (
          <p className="text-center text-[13px] text-ink/50 mt-6">
            {analyses.length} analizden {filteredAnalyses.length} tanesi gösteriliyor
          </p>
        )}
      </div>
    </div>
  );
}
