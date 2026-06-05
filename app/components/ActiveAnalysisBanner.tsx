'use client';

// ============================================================================
// ActiveAnalysisBanner — global "aktif analiz" göstergesi
// ============================================================================
// Root layout'a monte edilir; App Router'da layout navigasyonda UNMOUNT OLMAZ,
// bu yüzden kullanıcı sayfalar arasında gezse de banner (ve state'i) korunur.
//
// Çözdüğü sorun: Eskiden analiz ilerlemesi sadece FileUploader'ın ephemeral
// useState'inde yaşıyordu → kullanıcı yükleme sayfasından ayrılıp dönünce
// çalışan analizden hiçbir iz kalmıyordu. Artık ilerleme DB'den (status=
// 'processing') türetilir ve Realtime + poll ile takip edilir: kullanıcı
// başlattıysa, BİTENE KADAR, HER SAYFADA görünür.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle, X, BarChart3 } from 'lucide-react';

type DocStatus = 'processing' | 'analyzed' | 'failed' | 'uploaded';

interface TrackedDoc {
  id: string;
  filename: string;
  status: DocStatus;
  overall_score: number | null;
  created_at: string;
}

// Yalnızca son bu pencerede başlamış processing'leri göster (eski/takılı kalmış
// dokümanları sonsuza dek gösterme — onlar Analizlerim'den "başarısız" işaretlenir).
const RECENT_WINDOW_MS = 30 * 60 * 1000; // 30 dk
const POLL_MS = 5000; // processing varken tamamlanmayı yakalamak için yedek poll

const SELECT_COLS = 'id, filename, status, overall_score, created_at';

export default function ActiveAnalysisBanner() {
  const supabase = createClientComponentClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [docs, setDocs] = useState<TrackedDoc[]>([]);
  const dismissedRef = useRef<Set<string>>(new Set());
  const docsRef = useRef<TrackedDoc[]>([]);
  useEffect(() => { docsRef.current = docs; }, [docs]);

  // --- Oturum ---
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) setDocs([]); // çıkışta temizle
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  // Bir dokümanı listeye ekle/güncelle (dismiss edilmişleri yok say).
  const upsert = useCallback((row: Partial<TrackedDoc> & { id: string }) => {
    if (dismissedRef.current.has(row.id)) return;
    setDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === row.id);
      if (idx === -1) return [{ ...(row as TrackedDoc) }, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...row };
      return next;
    });
  }, []);

  // İşlenmekte olan dokümanları KEŞFET + takip ettiklerimizin TAMAMLANMASINI yakala.
  // ÖNEMLİ: Realtime bu projede güvenilir teslim etmiyor (uygulamanın geri kalanı da
  // polling kullanıyor) — bu yüzden keşif Realtime'a DEĞİL periyodik poll'a dayanır.
  const reconcile = useCallback(async () => {
    if (!userId) return;
    const since = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
    // 1) Keşif: kullanıcının işlenmekte olan dokümanları
    const { data: processing } = await supabase
      .from('thesis_documents')
      .select(SELECT_COLS)
      .eq('user_id', userId)
      .eq('status', 'processing')
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    const processingIds = new Set((processing ?? []).map((d: any) => d.id));
    if (processing) for (const row of processing as TrackedDoc[]) upsert(row);
    // 2) Tamamlanma: takip ettiğimiz ama artık processing OLMAYAN dokümanların son durumu
    const stale = docsRef.current.filter((d) => d.status === 'processing' && !processingIds.has(d.id));
    if (stale.length) {
      const { data: finals } = await supabase
        .from('thesis_documents')
        .select(SELECT_COLS)
        .in('id', stale.map((d) => d.id));
      if (finals) {
        for (const row of finals as TrackedDoc[]) {
          if (!dismissedRef.current.has(row.id)) {
            setDocs((prev) => prev.map((d) => (d.id === row.id ? { ...d, ...row } : d)));
          }
        }
      }
    }
  }, [userId, supabase, upsert]);

  // Keşif + tamamlanma poll'u: userId varken SÜREKLI. Processing varken sık,
  // boştayken seyrek. Realtime'a bağımlı değil — banner her durumda görünür.
  const hasProcessing = docs.some((d) => d.status === 'processing');
  useEffect(() => {
    if (!userId) { setDocs([]); return; }
    reconcile();
    const interval = setInterval(reconcile, hasProcessing ? POLL_MS : 12000);
    return () => clearInterval(interval);
  }, [userId, hasProcessing, reconcile]);

  // --- Realtime: kullanıcının satırlarındaki INSERT (yeni analiz) + UPDATE (tamamlanma) ---
  useEffect(() => {
    if (!userId) return;
    let channel: RealtimeChannel | null = supabase
      .channel(`user-analyses:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thesis_documents', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as (Partial<TrackedDoc> & { id?: string }) | undefined;
          if (!row || !row.id) return;
          if (row.status === 'processing') {
            upsert(row as TrackedDoc);
          } else if (row.status === 'analyzed' || row.status === 'failed') {
            // Yalnızca zaten takip ettiğimiz (processing görmüş) dokümanı tamamlanmış göster.
            if (docsRef.current.some((d) => d.id === row.id)) {
              upsert(row as TrackedDoc);
            }
          }
        }
      )
      .subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [userId, supabase, upsert]);

  const dismiss = (id: string) => {
    dismissedRef.current.add(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (docs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-[min(92vw,360px)]">
      {docs.map((d) => (
        <div key={d.id} className="bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            {d.status === 'processing' ? (
              <Loader2 className="h-5 w-5 text-primary-600 animate-spin flex-shrink-0 mt-0.5" />
            ) : d.status === 'analyzed' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {d.status === 'processing' ? 'Tezin analiz ediliyor' : d.status === 'analyzed' ? 'Analiz tamamlandı' : 'Analiz başarısız'}
              </p>
              <p className="text-xs text-slate-500 truncate" title={d.filename}>{d.filename}</p>
              {d.status === 'processing' && (
                <p className="text-xs text-slate-400 mt-0.5">Sayfalarda gezsen de devam eder, ~1-3 dk.</p>
              )}
              {d.status === 'analyzed' && (
                <Link
                  href={`/analyses/${d.id}`}
                  onClick={() => dismiss(d.id)}
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <BarChart3 className="h-4 w-4" /> Raporu gör{d.overall_score != null ? ` · ${d.overall_score}/100` : ''}
                </Link>
              )}
              {d.status === 'failed' && (
                <p className="text-xs text-rose-500 mt-1">Kredilerin iade edildi, tekrar deneyebilirsin.</p>
              )}
            </div>
            {/* processing iken kapatılamaz — "başlattıysan bitene kadar görünsün" */}
            {d.status !== 'processing' && (
              <button onClick={() => dismiss(d.id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Kapat">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
