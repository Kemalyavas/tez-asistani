-- ============================================================================
-- TezAI — Migration v7: Çift-ücret race koruması + takılı-analiz kurtarma (2026-06-03)
-- ============================================================================
-- 3-agent yükleme/analiz denetimi sonrası. Prod'a MCP ile uygulandı.
--
-- NOT (ajan düzeltmesi): "idempotency_key UNIQUE yok" iddiası YANLIŞTI —
-- `credit_transactions_idempotency_key_uniq` (partial unique) ZATEN var, çift
-- iade/kredi DB seviyesinde korunuyor. Doğrulandı, ek index gerekmedi.
--
-- 1) idx_thesis_documents_cache_lookup non-unique idi → eşzamanlı iki start
--    (çift-tık/çoklu-sekme) ikisi de cache-miss → çift ücret riski. UNIQUE yapıldı:
--    ikinci insert artık DB'de engellenir; analyze/start insert-fail'de krediyi
--    zaten iade ettiği için NET TEK ücret olur.
-- 2) recover_stuck_analyses(): client process'i tetikleyemezse / lambda ölürse
--    doküman sonsuza dek 'processing' kalıyor, kredi yanıyor, otomatik iade yoktu.
--    Bu fonksiyon 20dk+ takılı processing'leri failed yapıp krediyi iade eder
--    (idempotent — credit_transactions_idempotency_key_uniq sayesinde çift iade
--    imkansız). Tek seferlik çalıştırıldı: ddf99eea-… (127 gün takılı, 10 kredi
--    yanmış kullanıcı) kurtarıldı, 10 kredi iade edildi.
--
-- SONRAKİ ADIM (onayla): pg_cron ile zamanlama (en altta, yorumlu).
-- ============================================================================

DROP INDEX IF EXISTS public.idx_thesis_documents_cache_lookup;
CREATE UNIQUE INDEX idx_thesis_documents_cache_lookup
  ON public.thesis_documents (user_id, file_sha256, rubric_version)
  WHERE file_sha256 IS NOT NULL AND status IN ('analyzed', 'processing');

CREATE OR REPLACE FUNCTION public.recover_stuck_analyses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doc RECORD;
  v_count integer := 0;
BEGIN
  FOR v_doc IN
    SELECT id, user_id, coalesce(credits_used, 0) AS credits_used
    FROM thesis_documents
    WHERE status = 'processing' AND created_at < now() - interval '20 minutes'
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE thesis_documents
       SET status = 'failed',
           analysis_result = jsonb_build_object('error',
             'Analiz tamamlanamadı (zaman aşımı / otomatik kurtarma). Kredileriniz iade edildi.')
     WHERE id = v_doc.id AND status = 'processing';
    IF FOUND AND v_doc.credits_used > 0 THEN
      PERFORM add_credits(v_doc.user_id, v_doc.credits_used, 0, NULL, NULL,
                          'refund_stuck_' || v_doc.id::text, 'refund');
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recover_stuck_analyses() FROM PUBLIC, anon, authenticated;

-- Tek seferlik kurtarma (uygulandı):
--   SELECT public.recover_stuck_analyses();  -- → 1 (ddf99eea kurtarıldı)

-- ----------------------------------------------------------------------------
-- pg_cron ile otomatik kurtarma — UYGULANDI (migration v8, 3 Haz 2026, prod):
-- Supabase İÇİ zamanlayıcı (harici servis/Vercel cron YOK). cron.job: jobid=1,
-- active=true, her 10 dk recover_stuck_analyses() çağırır.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('recover-stuck-analyses', '*/10 * * * *',
                     $$SELECT public.recover_stuck_analyses();$$);
