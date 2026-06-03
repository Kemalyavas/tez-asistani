-- ============================================================================
-- TezAI — Migration v5: Payment RLS Fix + Security Hardening
-- ============================================================================
-- 2 Haziran 2026 — Kritik ödeme bugu düzeltmesi ve güvenlik sertleştirmesi.
--
-- BAĞLAM: public.payment_history'de RLS açıktı ama INSERT politikası YOKTU.
-- checkout pending kaydını (kullanıcının kendi oturumuyla) yazamıyor, hata
-- sessizce yutuluyordu; callback/webhook user_id'yi bu pending kayıttan okuyup
-- add_credits'i çağırdığı için, kayıt olmayınca KREDİ HİÇ EKLENMİYORDU.
-- Sonuç: ödeme Iyzico'da başarılı, kullanıcının kredisi yansımıyor.
--
-- Bu migration, 2 Haziran 2026 gecesi prod DB'ye MCP ile canlı uygulanan
-- değişiklikleri repo'da kalıcılaştırır. Tamamı idempotent — tekrar çalıştırılabilir.
-- (Uygulama tarafı düzeltmesi ayrı: commit 543c6e0 — callback/webhook user_id
--  yedeği + checkout'ta tam user.id gömme.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ASIL FİX: payment_history INSERT politikası
-- ----------------------------------------------------------------------------
-- checkout'taki pending INSERT'i, authenticated kullanıcı yalnızca kendi adına
-- ve yalnızca 'pending' durumda yazabilsin (sahte 'success' enjekte edemesin).
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_history;
CREATE POLICY "Users can insert own payments"
  ON public.payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- ----------------------------------------------------------------------------
-- 2) GÜVENLİK: kullanılmayan / trigger SECURITY DEFINER fonksiyonlarından
--    public/anon/authenticated EXECUTE iznini kaldır.
-- ----------------------------------------------------------------------------
-- Bu fonksiyonlar kod tabanından .rpc() ile çağrılmıyor. Trigger fonksiyonları
-- (handle_new_user, protect_profile_sensitive_columns) EXECUTE iznine bakmadan
-- owner yetkisiyle çalışmaya devam eder; revoke yalnızca REST/RPC yüzeyini kapatır.
-- DİKKAT: use_credits'e DOKUNMA — client hook (useCredits.ts) çağırıyor ve içinde
-- auth.uid() <> p_user_id guard'ı var (güvenli). add_credits zaten service_role-only.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_columns()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_overall_score(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_daily_analysis_limit(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_subscription_status(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_similar_chunks(uuid, public.vector, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_analysis_status(uuid, integer, integer, text, integer, text)   FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) GÜVENLİK: fonksiyon search_path sabitleme (lint: function_search_path_mutable)
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.protect_profile_sensitive_columns()                SET search_path = public;
ALTER FUNCTION public.get_user_subscription_status(uuid)                 SET search_path = public;
ALTER FUNCTION public.update_analysis_status(uuid, integer, integer, text, integer, text) SET search_path = public;
ALTER FUNCTION public.calculate_overall_score(uuid)                      SET search_path = public;
ALTER FUNCTION public.check_daily_analysis_limit(uuid, integer)          SET search_path = public;

-- ----------------------------------------------------------------------------
-- NOT (uygulanamayan / bilinçli bırakılanlar):
--   * "Leaked password protection": Supabase Pro özelliği; proje Free planda → açılamaz.
--   * "vector extension in public schema": taşıma legacy RAG tablolarını riske atar → bırakıldı.
--   * use_credits authenticated'a açık: kasıtlı (client hook + auth.uid() guard).
-- ============================================================================
