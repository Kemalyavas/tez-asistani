-- ============================================================================
-- TezAI Migration v4: Idempotency & Double-credit protection
-- ============================================================================
--
-- Amaç:
--   1. Aynı payment_id ile iki kez 'purchase' eklenmesini engelle (callback + webhook race)
--   2. Aynı refund işleminin iki kez yapılmasını engelle (idempotency_key)
--   3. conversation_id sorguları için index
--
-- Güvenlik:
--   - Tüm işlemler IF NOT EXISTS / OR REPLACE ile idempotent — tekrar çalıştırılabilir
--   - add_credits RPC'si genişletildi ama eski çağrılar (6 param) hala çalışır
--     (p_idempotency_key ve p_transaction_type DEFAULT NULL / 'purchase')
--
-- Rollback planı: aşağıda en altta yorum olarak mevcut.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. credit_transactions tablosuna idempotency_key kolonu
-- ----------------------------------------------------------------------------
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

COMMENT ON COLUMN public.credit_transactions.idempotency_key IS
  'Uniquely identifies a refund or non-purchase credit op so retries do not double-credit.';

-- ----------------------------------------------------------------------------
-- 2. Partial unique index: idempotency_key (sadece NULL değilse)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_uniq
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Partial unique index: purchase işlemleri için (payment_id, transaction_type)
--    Aynı payment_id ile ikinci bir 'purchase' eklenmeye çalışılırsa
--    UNIQUE violation çıkar → RPC içinde yakalanır ve idempotent dönüş verilir.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_purchase_payment_uniq
  ON public.credit_transactions (payment_id, transaction_type)
  WHERE payment_id IS NOT NULL AND transaction_type = 'purchase';

-- ----------------------------------------------------------------------------
-- 4. payment_history.conversation_id için index (OR sorguları hızlansın)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payment_history_conversation_id
  ON public.payment_history(conversation_id)
  WHERE conversation_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. add_credits RPC — idempotency_key ve transaction_type destekli
--    Eski API uyumlu: yeni parametreler DEFAULT değerli, çağrılar kırılmaz.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_bonus INTEGER DEFAULT 0,
  p_payment_id TEXT DEFAULT NULL,
  p_package_id TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_transaction_type TEXT DEFAULT 'purchase'
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_total_amount INTEGER;
  v_existing_id UUID;
BEGIN
  v_total_amount := p_amount + p_bonus;

  -- İdempotency check 1: aynı idempotency_key önceden işlenmiş mi?
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

  -- İdempotency check 2: aynı payment_id ile purchase önceden eklenmiş mi?
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

  -- Mevcut bakiye + satır kilidi
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + v_total_amount;

  -- Profiles güncelle (sadece purchase'ta total_credits_purchased artar)
  UPDATE public.profiles
  SET
    credits = v_new_balance,
    total_credits_purchased = CASE
      WHEN p_transaction_type = 'purchase' THEN total_credits_purchased + v_total_amount
      ELSE total_credits_purchased
    END,
    last_activity_at = NOW()
  WHERE id = p_user_id;

  -- Ana transaction kaydı
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

  -- Bonus (varsa, ayrı kayıt)
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
    -- Race koşulunda (iki concurrent insert aynı key ile) idempotent dön
    SELECT credits INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT true, COALESCE(v_current_balance, 0), 'Race detected - idempotent'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- ROLLBACK (gerekirse):
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS public.credit_transactions_idempotency_key_uniq;
-- DROP INDEX IF EXISTS public.credit_transactions_purchase_payment_uniq;
-- DROP INDEX IF EXISTS public.idx_payment_history_conversation_id;
-- ALTER TABLE public.credit_transactions DROP COLUMN IF EXISTS idempotency_key;
-- -- add_credits eski haline dönmek için supabase_setup.sql:408 bloğunu yeniden çalıştır
-- COMMIT;
