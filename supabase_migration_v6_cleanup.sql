-- ============================================================================
-- TezAI — Migration v6: Legacy temizlik + fiyat verisi düzeltme (2026-06-03)
-- ============================================================================
-- Geri yükleme yedeği: supabase_cleanup_backup_2026-06-03.sql
--
-- Silinen objeler ÖLÜ legacy (kanıt: aktif TS kodu yok, .rpc çağrısı yok,
-- trigger/view yok, QStash jobs pipeline dormant — aktif pipeline
-- analyze/start→analyze/process doğrudan çalışıyor):
--   - QStash/multi-agent legacy: agent_results, analysis_steps + fonksiyon
--     calculate_overall_score
--   - RAG/embedding legacy: thesis_chunks + fonksiyon search_similar_chunks
--   - Abonelik sistemi (kaldırıldı, kredi tabanlı): user_subscriptions,
--     subscription_plans + fonksiyon get_user_subscription_status
--   - Kullanılmayan referans: credit_costs (kod lib/pricing.ts kullanıyor)
--
-- credit_packages SİLİNMEDİ (payment_history/credit_transactions FK'li); yalnızca
-- stale verisi lib/pricing.ts ile eşitlendi (yanlış USD fiyatları → gerçek TRY).
-- ============================================================================

-- 1) Legacy fonksiyonlar (tabloları kullananlar) önce
DROP FUNCTION IF EXISTS public.calculate_overall_score(uuid);
DROP FUNCTION IF EXISTS public.get_user_subscription_status(uuid);
DROP FUNCTION IF EXISTS public.search_similar_chunks(uuid, vector, integer, double precision);

-- 2) Tablolar — FK-güvenli sırada (referans eden önce)
DROP TABLE IF EXISTS public.user_subscriptions;   -- subscription_plans'e FK
DROP TABLE IF EXISTS public.subscription_plans;
DROP TABLE IF EXISTS public.agent_results;
DROP TABLE IF EXISTS public.analysis_steps;
DROP TABLE IF EXISTS public.thesis_chunks;
DROP TABLE IF EXISTS public.credit_costs;

-- 3) credit_packages verisini lib/pricing.ts ile EŞİTLE (silme yok)
UPDATE public.credit_packages SET credits=50,   bonus_credits=0,   price_usd=149,  name='Starter Paket'  WHERE id='starter';
UPDATE public.credit_packages SET credits=200,  bonus_credits=40,  price_usd=449,  name='Standart Paket' WHERE id='standard';
UPDATE public.credit_packages SET credits=400,  bonus_credits=100, price_usd=749,  name='Pro Paket'      WHERE id='pro';
UPDATE public.credit_packages SET credits=1000, bonus_credits=250, price_usd=1499, name='Ultimate Paket' WHERE id='ultimate';
