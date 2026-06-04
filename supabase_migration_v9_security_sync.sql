-- ============================================================================
-- TezAI — Migration v9: Güvenlik objelerinin repo↔prod SENKRONU (4 Haz 2026)
-- ============================================================================
-- DURUM: Aşağıdaki TÜM objeler 2 Haziran 2026 gecesi prod DB'ye MCP ile ELLE
-- uygulandı ama repo migration'larına DÖKÜLMEMİŞTİ (drift). 4 Haz denetiminde
-- (4 Opus agent + prod DB doğrulaması) ortaya çıktı: agent'lar repo'ya bakıp
-- "guard yok, açık olabilir" dedi; prod doğrulaması hepsinin GÜVENLİ olduğunu
-- gösterdi. Bu dosya prod'daki GERÇEK tanımları repo'ya kaynak-gerçek olarak
-- kalıcılaştırır.
--
-- NEDEN ÖNEMLİ: Bu objeler olmadan sistem AÇIKTIR (sınırsız kredi, başkasının
-- kredisi, doğrudan profil credits yazma). Repo'da yoklarsa: (a) yeni ortam/DB
-- kurulumu güvensiz başlar, (b) biri prod'da fonksiyonu CREATE OR REPLACE ederse
-- guard sessizce kaybolur. Bu dosya o riski kapatır.
--
-- UYGULAMA NOTU: Prod'da ZATEN mevcut olduğundan bu dosya prod'a tekrar
-- uygulanmadı. İDEMPOTENT yazıldı (CREATE OR REPLACE / DROP..IF EXISTS / IF NOT
-- EXISTS) — yeni ortamda veya gerekirse prod'da güvenle çalıştırılabilir.
--
-- DENETİMDE PROD'DA DOĞRULANANLAR (pg_proc/pg_policy/pg_trigger/pg_indexes):
--   ✓ use_credits: auth.uid()<>p_user_id guard + p_amount<=0 reddi
--   ✓ add_credits: EXECUTE yalnız service_role (authenticated REVOKE'lu), tek 7-param
--   ✓ protect_profile_sensitive_columns_trg: BEFORE UPDATE profiles, aktif
--   ✓ credit_transactions iki partial-unique index (idempotency)
--   ✓ RLS: profiles/payment_history/credit_transactions/thesis_documents/
--          rubric_feedback + storage(thesis-files) — hepsi own-row izolasyonu
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) use_credits — kredi DÜŞME (client RPC ile çağrılır, bu yüzden guard ŞART)
--    Guard'lar: (a) auth.uid()<>p_user_id → başkasının kredisini düşemez;
--               (b) p_amount<=0 → negatif amount ile kredi BASILAMAZ.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id uuid,
  p_amount integer,
  p_action_type text,
  p_description text DEFAULT NULL::text
)
RETURNS TABLE(success boolean, new_balance integer, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Auth guard: client-side çağrıda kullanıcı sadece kendi kredisini düşebilir.
  -- service_role'da auth.uid() NULL → backend etkilenmez.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN QUERY SELECT false, 0, 'Permission denied'::TEXT;
    RETURN;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, 0, 'Invalid amount'::TEXT;
    RETURN;
  END IF;

  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.profiles
  SET
    credits = v_new_balance,
    total_credits_used = total_credits_used + p_amount,
    last_activity_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, action_type, description)
  VALUES (p_user_id, -p_amount, v_new_balance, 'usage', p_action_type, p_description);

  IF p_action_type LIKE 'thesis%' THEN
    UPDATE public.profiles SET thesis_analyses_count = thesis_analyses_count + 1 WHERE id = p_user_id;
  ELSIF p_action_type = 'abstract_generate' THEN
    UPDATE public.profiles SET abstracts_count = abstracts_count + 1 WHERE id = p_user_id;
  ELSIF p_action_type = 'citation_format' THEN
    UPDATE public.profiles SET citations_count = citations_count + 1 WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 2) add_credits — kredi EKLEME/İADE (SADECE service_role çağırmalı).
--    İki katmanlı idempotency: idempotency_key + (payment_id,'purchase').
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_bonus integer DEFAULT 0,
  p_payment_id text DEFAULT NULL::text,
  p_package_id text DEFAULT NULL::text,
  p_idempotency_key text DEFAULT NULL::text,
  p_transaction_type text DEFAULT 'purchase'::text
)
RETURNS TABLE(success boolean, new_balance integer, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_total_amount INTEGER;
  v_existing_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount < 0 OR p_bonus IS NULL OR p_bonus < 0 THEN
    RETURN QUERY SELECT false, 0, 'Invalid amount'::TEXT;
    RETURN;
  END IF;

  v_total_amount := p_amount + p_bonus;

  -- Idempotency 1: idempotency_key (özellikle refund'lar için)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.credit_transactions
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      SELECT credits INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
      RETURN QUERY SELECT true, COALESCE(v_current_balance, 0), 'Already processed (idempotency_key)'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Idempotency 2: payment_id + 'purchase' (callback/webhook race)
  IF p_payment_id IS NOT NULL AND p_transaction_type = 'purchase' THEN
    SELECT id INTO v_existing_id
    FROM public.credit_transactions
    WHERE payment_id = p_payment_id AND transaction_type = 'purchase'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      SELECT credits INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
      RETURN QUERY SELECT true, COALESCE(v_current_balance, 0), 'Already processed (payment_id)'::TEXT;
      RETURN;
    END IF;
  END IF;

  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + v_total_amount;

  UPDATE public.profiles
  SET
    credits = v_new_balance,
    total_credits_purchased = CASE
      WHEN p_transaction_type = 'purchase' THEN total_credits_purchased + v_total_amount
      ELSE total_credits_purchased
    END,
    last_activity_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    payment_id, package_id, idempotency_key, description
  )
  VALUES (
    p_user_id, p_amount, v_current_balance + p_amount, p_transaction_type,
    p_payment_id, p_package_id, p_idempotency_key,
    CASE
      WHEN p_transaction_type = 'refund' THEN 'Refund: ' || COALESCE(p_idempotency_key, 'unknown')
      WHEN p_transaction_type = 'purchase' THEN 'Purchased ' || p_amount || ' credits'
      ELSE p_transaction_type
    END
  );

  -- Bonus (sadece purchase'ta)
  IF p_bonus > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, amount, balance_after, transaction_type,
      payment_id, package_id, description
    )
    VALUES (
      p_user_id, p_bonus, v_new_balance, 'bonus',
      p_payment_id, p_package_id,
      'Bonus credits from ' || COALESCE(p_package_id, 'purchase')
    );
  END IF;

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;

EXCEPTION
  WHEN unique_violation THEN
    SELECT credits INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT true, COALESCE(v_current_balance, 0), 'Race detected - idempotent'::TEXT;
END;
$function$;

-- add_credits SADECE service_role'a açık (kredi ekleme client'a kapalı).
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid,integer,integer,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid,integer,integer,text,text,text,text) TO service_role;

-- use_credits authenticated'a AÇIK (client çağırır) — guvenlik fonksiyon-içi guard'da.
GRANT EXECUTE ON FUNCTION public.use_credits(uuid,integer,text,text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3) profiles hassas-kolon koruması — RLS UPDATE politikası kolon-kör olduğu
--    için credits/sayaç kolonlarını trigger ile kilitler (yalnız service_role serbest).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Güvenli rollerden gelen UPDATE'leri serbest bırak
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- authenticated/anon: hassas kolonların değişmesini engelle
  IF NEW.credits IS DISTINCT FROM OLD.credits
     OR NEW.total_credits_purchased IS DISTINCT FROM OLD.total_credits_purchased
     OR NEW.total_credits_used IS DISTINCT FROM OLD.total_credits_used
     OR NEW.thesis_analyses_count IS DISTINCT FROM OLD.thesis_analyses_count
     OR NEW.abstracts_count IS DISTINCT FROM OLD.abstracts_count
     OR NEW.citations_count IS DISTINCT FROM OLD.citations_count THEN
    RAISE EXCEPTION 'Cannot modify protected columns directly'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_sensitive_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- ----------------------------------------------------------------------------
-- 4) RLS — own-row izolasyonu (tüm tablolarda RLS prod'da ENABLE doğrulandı)
-- ----------------------------------------------------------------------------
-- payment_history: SELECT own + INSERT own&pending (2 Haz fix kalbi). UPDATE/DELETE YOK.
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
CREATE POLICY "Users can view own payments" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_history;
CREATE POLICY "Users can insert own payments" ON public.payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- credit_transactions: yalnız SELECT own. INSERT/UPDATE/DELETE YOK (yazma SECURITY DEFINER fn'lerden).
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- thesis_documents: own-row tüm işlemler (IDOR defense-in-depth + route guard).
DROP POLICY IF EXISTS "Users can view own documents" ON public.thesis_documents;
CREATE POLICY "Users can view own documents" ON public.thesis_documents
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own documents" ON public.thesis_documents;
CREATE POLICY "Users can insert own documents" ON public.thesis_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own documents" ON public.thesis_documents;
CREATE POLICY "Users can update own documents" ON public.thesis_documents
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own documents" ON public.thesis_documents;
CREATE POLICY "Users can delete own documents" ON public.thesis_documents
  FOR DELETE USING (auth.uid() = user_id);

-- rubric_feedback: own-row tüm işlemler.
DROP POLICY IF EXISTS "Users can view own rubric_feedback" ON public.rubric_feedback;
CREATE POLICY "Users can view own rubric_feedback" ON public.rubric_feedback
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own rubric_feedback" ON public.rubric_feedback;
CREATE POLICY "Users can insert own rubric_feedback" ON public.rubric_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own rubric_feedback" ON public.rubric_feedback;
CREATE POLICY "Users can update own rubric_feedback" ON public.rubric_feedback
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own rubric_feedback" ON public.rubric_feedback;
CREATE POLICY "Users can delete own rubric_feedback" ON public.rubric_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5) Storage (thesis-files bucket) — kullanıcı yalnız kendi klasörüne erişir.
--    Klasör adı = auth.uid() (FileUploader `${user.id}/${ts}.ext` ile yükler).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'thesis-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thesis-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'thesis-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ----------------------------------------------------------------------------
-- 6) İdempotency index'leri (credit_transactions) — çift kredi/iade DB engeli.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_uniq
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_purchase_payment_uniq
  ON public.credit_transactions (payment_id, transaction_type)
  WHERE payment_id IS NOT NULL AND transaction_type = 'purchase';

-- ============================================================================
-- SON. Bu dosya prod'u DEĞİŞTİRMEZ (objeler zaten var); repo'yu prod'la eşitler.
-- ============================================================================
