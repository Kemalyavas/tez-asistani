-- ============================================================================
-- TezAI — Supabase Temizlik YEDEĞİ (2026-06-03)
-- ============================================================================
-- Bu dosya, supabase_migration_v6_cleanup.sql ile SİLİNEN legacy objelerin
-- GERİ YÜKLENMESİ için yedektir. Silme geri-dönülebilir olsun diye tutuluyor.
--
-- Silinen tablolar (hepsi ölü legacy — aktif kod/rpc/trigger/view yok):
--   agent_results, analysis_steps, thesis_chunks (0 satır; QStash jobs +
--   RAG/embedding legacy sistemi — artık tam PDF doğrudan Gemini'ye gidiyor)
--   user_subscriptions, subscription_plans (abonelik sistemi kaldırıldı, kredi tabanlı)
--   credit_costs (runtime'da okunmuyordu; kod lib/pricing.ts kullanıyor)
-- Silinen fonksiyonlar: calculate_overall_score, get_user_subscription_status,
--   search_similar_chunks
--
-- TABLO ŞEMALARI (CREATE TABLE) git'te mevcut:
--   supabase_setup.sql        → credit_packages, credit_costs, thesis_chunks
--   supabase_migration_v3.sql → analysis_steps, agent_results,
--                               subscription_plans, user_subscriptions
-- Geri yüklemek için: ilgili CREATE TABLE'ları o dosyalardan çalıştır, sonra
-- aşağıdaki fonksiyon tanımlarını ve INSERT'leri uygula.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FONKSİYONLAR (silinmeden önceki tam tanımlar)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_overall_score(p_document_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_weight DECIMAL := 0;
  v_weighted_sum DECIMAL := 0;
  v_agent RECORD;
BEGIN
  FOR v_agent IN
    SELECT agent_id, parsed_score,
      CASE agent_id
        WHEN 'structure' THEN 0.20
        WHEN 'methodology' THEN 0.30
        WHEN 'writing' THEN 0.25
        WHEN 'references' THEN 0.15
        WHEN 'originality' THEN 0.10
        ELSE 0.10
      END AS weight
    FROM public.agent_results
    WHERE document_id = p_document_id AND parsed_score IS NOT NULL
  LOOP
    v_weighted_sum := v_weighted_sum + (v_agent.parsed_score * v_agent.weight);
    v_total_weight := v_total_weight + v_agent.weight;
  END LOOP;
  IF v_total_weight = 0 THEN RETURN 50.00; END IF;
  RETURN ROUND(v_weighted_sum / v_total_weight, 2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id uuid)
 RETURNS TABLE(has_subscription boolean, plan_id text, plan_name text, status text, period_end timestamp with time zone, features jsonb, limits jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT true AS has_subscription, us.plan_id, sp.name AS plan_name, us.status,
    us.current_period_end AS period_end, sp.features, sp.limits
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false AS has_subscription, 'free'::TEXT AS plan_id, 'Ücretsiz'::TEXT AS plan_name,
      'active'::TEXT AS status, NULL::TIMESTAMP WITH TIME ZONE AS period_end, sp.features, sp.limits
    FROM public.subscription_plans sp WHERE sp.id = 'free';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_similar_chunks(p_thesis_id uuid, p_query_embedding vector, p_limit integer DEFAULT 5, p_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(chunk_id uuid, content text, section_type text, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT tc.id, tc.content, tc.section_type, 1 - (tc.embedding <=> p_query_embedding) AS similarity
  FROM public.thesis_chunks tc
  WHERE tc.thesis_id = p_thesis_id AND tc.embedding IS NOT NULL
    AND 1 - (tc.embedding <=> p_query_embedding) > p_threshold
  ORDER BY tc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$function$;

-- ----------------------------------------------------------------------------
-- VERİ (silinmeden önceki satırlar)
-- agent_results, analysis_steps, thesis_chunks, user_subscriptions = 0 satır (veri yok)
-- ----------------------------------------------------------------------------

-- subscription_plans (4 satır)
INSERT INTO public.subscription_plans (id, name, monthly_price_usd, annual_price_usd, monthly_credits, features, limits, is_active, sort_order) VALUES
('free','Ücretsiz',0,0,0,'["Günlük 1 ücretsiz basic analiz","50 sayfa limit","Sonuç önizleme"]','{"max_pages":50,"full_report":false,"max_analyses_per_day":1}',true,1),
('basic','Temel',9.99,99.99,50,'["Aylık 50 kredi","100 sayfa limit","Tam rapor","Email desteği"]','{"max_pages":100,"full_report":true,"max_analyses_per_day":5}',true,2),
('pro','Profesyonel',29.99,299.99,200,'["Aylık 200 kredi","Sınırsız sayfa","Çapraz doğrulama","PDF rapor","Öncelikli destek"]','{"max_pages":null,"pdf_report":true,"full_report":true,"cross_validation":true,"max_analyses_per_day":20}',true,3),
('enterprise','Kurumsal',NULL,NULL,0,'["Özel kredi paketi","Sınırsız kullanım","API erişimi","Dedicated destek","SLA garantisi"]','{"max_pages":null,"api_access":true,"pdf_report":true,"full_report":true,"cross_validation":true,"max_analyses_per_day":null}',true,4);

-- credit_costs (8 satır)
INSERT INTO public.credit_costs (action_type, credits_required, description, category, is_active) VALUES
('citation_format',1,'Format a single citation (APA, MLA, Chicago, IEEE)','citation',true),
('abstract_generate',3,'Generate thesis abstract (TR/EN)','abstract',true),
('thesis_basic',10,'Temel analiz (< 50 sayfa) - Yapı kontrolü, temel yazım','thesis',true),
('thesis_standard',25,'Standart analiz (50-150 sayfa) - Multi-agent detaylı analiz','thesis',true),
('thesis_comprehensive',50,'Kapsamlı analiz (150+ sayfa) - Çapraz doğrulama dahil','thesis',true),
('revision_tracking',15,'Revizyon takibi ve öneriler','analysis',true),
('comparative_analysis',10,'Önceki versiyon ile karşılaştırma','analysis',true),
('pdf_report',5,'PDF rapor indirme','report',true);

-- credit_packages (4 satır — silinmeden ÖNCEKİ eski/stale hali; v6'da pricing.ts ile düzeltildi)
-- NOT: Bu tablo SİLİNMEDİ, sadece verisi düzeltildi. Bu, eski hali (gerekirse geri al).
-- UPDATE public.credit_packages SET credits=50,  bonus_credits=0,   price_usd=5,  name='Starter Pack'  WHERE id='starter';
-- UPDATE public.credit_packages SET credits=200, bonus_credits=40,  price_usd=15, name='Standard Pack' WHERE id='standard';
-- UPDATE public.credit_packages SET credits=500, bonus_credits=100, price_usd=35, name='Pro Pack'      WHERE id='pro';
-- UPDATE public.credit_packages SET credits=1200,bonus_credits=300, price_usd=75, name='Ultimate Pack' WHERE id='ultimate';
