'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AnalysisStatus {
  step: number;
  totalSteps: number;
  stepName: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  updatedAt?: string;
}

export interface DocumentStatus {
  id: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
  processing_status: AnalysisStatus | null;
  overall_score: number | null;
  analyzed_at: string | null;
}

interface UseAnalysisStatusOptions {
  pollInterval?: number;
  enableRealtime?: boolean;
}

export function useAnalysisStatus(
  documentId: string | null,
  options: UseAnalysisStatusOptions = {}
) {
  const { pollInterval = 3000, enableRealtime = true } = options;

  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Manuel fetch
  const fetchStatus = useCallback(async () => {
    if (!documentId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('thesis_documents')
        .select('id, status, processing_status, overall_score, analyzed_at')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Status fetch error:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setDocumentStatus(data);
        setStatus(data.processing_status);
        setIsCompleted(data.status === 'analyzed');
        setIsFailed(data.status === 'failed');

        if (data.processing_status?.error) {
          setError(data.processing_status.error);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Durum alınamadı');
    }
  }, [documentId, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!documentId || !enableRealtime) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel(`analysis:${documentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'thesis_documents',
            filter: `id=eq.${documentId}`,
          },
          (payload) => {
            const newData = payload.new as DocumentStatus;

            setDocumentStatus(newData);
            setStatus(newData.processing_status);
            setIsCompleted(newData.status === 'analyzed');
            setIsFailed(newData.status === 'failed');

            if (newData.processing_status?.error) {
              setError(newData.processing_status.error);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    // İlk fetch
    fetchStatus();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [documentId, enableRealtime, supabase, fetchStatus]);

  // Polling fallback (realtime çalışmazsa)
  useEffect(() => {
    if (!documentId || isCompleted || isFailed) return;

    const interval = setInterval(fetchStatus, pollInterval);

    return () => clearInterval(interval);
  }, [documentId, isCompleted, isFailed, pollInterval, fetchStatus]);

  // Progress yüzdesi hesapla
  const progressPercentage = status
    ? Math.round((status.step / status.totalSteps) * 100 * (status.progress / 100))
    : 0;

  // Tahmini kalan süre (saniye)
  const estimatedRemaining = status
    ? Math.max(0, (status.totalSteps - status.step) * 60 + (100 - status.progress) * 0.6)
    : null;

  return {
    status,
    documentStatus,
    isCompleted,
    isFailed,
    error,
    progressPercentage,
    estimatedRemaining,
    refetch: fetchStatus,
  };
}

// Birden fazla dökümanı takip etmek için
export function useMultipleAnalysisStatus(documentIds: string[]) {
  const [statuses, setStatuses] = useState<Map<string, DocumentStatus>>(new Map());
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (documentIds.length === 0) return;

    const fetchAll = async () => {
      const { data } = await supabase
        .from('thesis_documents')
        .select('id, status, processing_status, overall_score, analyzed_at')
        .in('id', documentIds);

      if (data) {
        const map = new Map<string, DocumentStatus>();
        data.forEach((doc) => map.set(doc.id, doc));
        setStatuses(map);
      }
    };

    fetchAll();

    // Realtime subscription for all documents
    const channel = supabase
      .channel('analysis:multi')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'thesis_documents',
          filter: `id=in.(${documentIds.join(',')})`,
        },
        (payload) => {
          const newData = payload.new as DocumentStatus;
          setStatuses((prev) => new Map(prev).set(newData.id, newData));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentIds, supabase]);

  return statuses;
}
