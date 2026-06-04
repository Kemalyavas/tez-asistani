-- ============================================================================
-- TezAI — Migration v10: Bonus kredi idempotency index (4 Haz 2026)
-- ============================================================================
-- 4 Haz denetiminde (Agent 3) tespit: `add_credits` bonus satırını ayrı INSERT
-- ediyor ve idempotency unique index'i YALNIZCA (payment_id,'purchase') üzerinde.
-- Bonus için unique kısıt yok; pratikte ana 'purchase' satırının INSERT sırası
-- koruyor (race'te ikinci çağrı purchase unique_violation'a düşüp bonus'a hiç
-- ulaşmıyor) ama bu garanti INSERT-sırasına bağlı (kırılgan). Bu index korumayı
-- DB seviyesine taşır: eşzamanlı callback/webhook race'inde çift bonus KESİN engellenir.
--
-- GÜVENLİK: Uygulamadan önce prod'da çift-bonus (payment_id başına >1 bonus)
-- OLMADIĞI doğrulandı (sorgu boş döndü) → CREATE UNIQUE INDEX çakışmadan geçer.
-- Additive, geri-dönüşsüz risk yok. Prod'a apply_migration ile uygulandı + repo senkronu.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_bonus_payment_uniq
  ON public.credit_transactions (payment_id, transaction_type)
  WHERE payment_id IS NOT NULL AND transaction_type = 'bonus';
