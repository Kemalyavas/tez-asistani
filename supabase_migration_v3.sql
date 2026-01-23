-- ============================================================================
-- TezAI Database Migration v3.0 - Multi-Agent Architecture
-- ============================================================================
-- Bu migration, yeni Multi-Agent analiz sistemini desteklemek için
-- gerekli tabloları ve fonksiyonları ekler.
-- ============================================================================

-- ============================================================================
-- 1. THESIS_DOCUMENTS TABLOSUNA YENİ SÜTUNLAR
-- ============================================================================

-- processing_status sütunu ekle (Realtime için)
ALTER TABLE public.thesis_documents
ADD COLUMN IF NOT EXISTS processing_status JSONB DEFAULT NULL;

COMMENT ON COLUMN public.thesis_documents.processing_status IS
'Realtime analiz durumu: {step, totalSteps, stepName, progress, status, error}';

-- ============================================================================
-- 2. ANALYSIS_STEPS TABLOSU (Analiz adımları takibi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analysis_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.thesis_documents(id) ON DELETE CASCADE,

  -- Adım Bilgileri
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'

  -- Zaman Bilgileri
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Sonuç
  result JSONB,
  error_message TEXT,

  -- Zaman Damgası
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(document_id, step_number)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_analysis_steps_document_id ON public.analysis_steps(document_id);
CREATE INDEX IF NOT EXISTS idx_analysis_steps_status ON public.analysis_steps(status);

-- ============================================================================
-- 3. AGENT_RESULTS TABLOSU (Multi-Agent sonuçları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.thesis_documents(id) ON DELETE CASCADE,

  -- Agent Bilgileri
  agent_id TEXT NOT NULL,  -- 'structure', 'methodology', 'writing', 'references', 'originality'
  agent_name TEXT,
  model_used TEXT NOT NULL,  -- 'gemini-2.0-flash', 'gemini-2.5-pro', 'claude-sonnet'

  -- Sonuçlar
  raw_response JSONB,
  parsed_score DECIMAL(5,2),
  sub_scores JSONB,
  issues JSONB DEFAULT '[]'::JSONB,  -- [{severity, description, location, suggestion}]
  strengths JSONB DEFAULT '[]'::JSONB,
  feedback TEXT,

  -- Performans Metrikleri
  processing_time_ms INTEGER,
  token_usage JSONB,  -- {input, output, total}
  estimated_cost_usd DECIMAL(10,6),

  -- Zaman Damgası
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint (bir döküman için her agent bir kez çalışır)
  UNIQUE(document_id, agent_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_agent_results_document_id ON public.agent_results(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_agent_id ON public.agent_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_model ON public.agent_results(model_used);

-- ============================================================================
-- 4. SUBSCRIPTION_PLANS TABLOSU (Gelecek abonelik sistemi için)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,  -- 'free', 'basic', 'pro', 'enterprise'
  name TEXT NOT NULL,

  -- Fiyatlandırma
  monthly_price_usd DECIMAL(10,2),
  annual_price_usd DECIMAL(10,2),

  -- Özellikler
  monthly_credits INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::JSONB,
  limits JSONB DEFAULT '{}'::JSONB,  -- {max_pages, max_analyses_per_day, etc.}

  -- Durum
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Zaman Damgası
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan planları ekle
INSERT INTO public.subscription_plans (id, name, monthly_price_usd, annual_price_usd, monthly_credits, features, limits, sort_order) VALUES
  ('free', 'Ücretsiz', 0, 0, 0,
   '["Günlük 1 ücretsiz basic analiz", "50 sayfa limit", "Sonuç önizleme"]'::JSONB,
   '{"max_pages": 50, "max_analyses_per_day": 1, "full_report": false}'::JSONB, 1),
  ('basic', 'Temel', 9.99, 99.99, 50,
   '["Aylık 50 kredi", "100 sayfa limit", "Tam rapor", "Email desteği"]'::JSONB,
   '{"max_pages": 100, "max_analyses_per_day": 5, "full_report": true}'::JSONB, 2),
  ('pro', 'Profesyonel', 29.99, 299.99, 200,
   '["Aylık 200 kredi", "Sınırsız sayfa", "Çapraz doğrulama", "PDF rapor", "Öncelikli destek"]'::JSONB,
   '{"max_pages": null, "max_analyses_per_day": 20, "full_report": true, "cross_validation": true, "pdf_report": true}'::JSONB, 3),
  ('enterprise', 'Kurumsal', NULL, NULL, 0,
   '["Özel kredi paketi", "Sınırsız kullanım", "API erişimi", "Dedicated destek", "SLA garantisi"]'::JSONB,
   '{"max_pages": null, "max_analyses_per_day": null, "full_report": true, "cross_validation": true, "pdf_report": true, "api_access": true}'::JSONB, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_usd = EXCLUDED.monthly_price_usd,
  annual_price_usd = EXCLUDED.annual_price_usd,
  monthly_credits = EXCLUDED.monthly_credits,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 5. USER_SUBSCRIPTIONS TABLOSU (Kullanıcı abonelikleri)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),

  -- Durum
  status TEXT DEFAULT 'active',  -- 'active', 'canceled', 'expired', 'past_due'

  -- Dönem Bilgileri
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- İptal Bilgileri
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Ödeme Bilgileri
  payment_provider TEXT,  -- 'iyzico', 'stripe', etc.
  payment_subscription_id TEXT,

  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Her kullanıcının sadece bir aktif aboneliği olabilir
  UNIQUE(user_id, status) -- partial unique için trigger gerekli
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);

-- ============================================================================
-- 6. CREDIT_PACKAGES GÜNCELLEME (Yeni paketler)
-- ============================================================================

-- Mevcut paketleri güncelle
UPDATE public.credit_packages SET
  price_usd = 9.99,
  description = 'Başlangıç için ideal'
WHERE id = 'starter';

UPDATE public.credit_packages SET
  credits = 120,
  price_usd = 19.99,
  bonus_credits = 24,
  description = 'En popüler paket - %20 bonus'
WHERE id = 'standard';

UPDATE public.credit_packages SET
  credits = 280,
  price_usd = 39.99,
  bonus_credits = 112,
  description = 'Tez yazarları için - %40 bonus'
WHERE id = 'pro';

UPDATE public.credit_packages SET
  credits = 600,
  price_usd = 74.99,
  bonus_credits = 360,
  description = 'Maksimum değer - %60 bonus'
WHERE id = 'ultimate';

-- ============================================================================
-- 7. CREDIT_COSTS GÜNCELLEME (Yeni tier'lar)
-- ============================================================================

-- Basic tier güncelle
UPDATE public.credit_costs SET
  credits_required = 10,
  description = 'Temel analiz (< 50 sayfa) - Yapı kontrolü, temel yazım'
WHERE action_type = 'thesis_basic';

-- Standard tier güncelle
UPDATE public.credit_costs SET
  credits_required = 25,
  description = 'Standart analiz (50-150 sayfa) - Multi-agent detaylı analiz'
WHERE action_type = 'thesis_standard';

-- Comprehensive tier güncelle
UPDATE public.credit_costs SET
  credits_required = 50,
  description = 'Kapsamlı analiz (150+ sayfa) - Çapraz doğrulama dahil'
WHERE action_type = 'thesis_comprehensive';

-- Yeni işlemler ekle
INSERT INTO public.credit_costs (action_type, credits_required, description, category) VALUES
  ('pdf_report', 5, 'PDF rapor indirme', 'report'),
  ('comparative_analysis', 10, 'Önceki versiyon ile karşılaştırma', 'analysis'),
  ('revision_tracking', 15, 'Revizyon takibi ve öneriler', 'analysis')
ON CONFLICT (action_type) DO UPDATE SET
  credits_required = EXCLUDED.credits_required,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (Yeni tablolar için)
-- ============================================================================

ALTER TABLE public.analysis_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Analysis Steps - kullanıcılar kendi dökümanlarının adımlarını görebilir
CREATE POLICY "Users can view own analysis steps" ON public.analysis_steps
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM public.thesis_documents WHERE user_id = auth.uid()
    )
  );

-- Agent Results - kullanıcılar kendi dökümanlarının agent sonuçlarını görebilir
CREATE POLICY "Users can view own agent results" ON public.agent_results
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM public.thesis_documents WHERE user_id = auth.uid()
    )
  );

-- Subscription Plans - herkes okuyabilir
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- User Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 9. YENİ FONKSİYONLAR
-- ============================================================================

-- 9.1 Analiz durumunu güncelle (Realtime tetikleyici olarak)
CREATE OR REPLACE FUNCTION public.update_analysis_status(
  p_document_id UUID,
  p_step INTEGER,
  p_total_steps INTEGER,
  p_step_name TEXT,
  p_progress INTEGER,
  p_status TEXT DEFAULT 'running'
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.thesis_documents
  SET processing_status = jsonb_build_object(
    'step', p_step,
    'totalSteps', p_total_steps,
    'stepName', p_step_name,
    'progress', p_progress,
    'status', p_status,
    'updatedAt', NOW()
  )
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.2 Agent sonuçlarından genel skor hesapla
CREATE OR REPLACE FUNCTION public.calculate_overall_score(p_document_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_weight DECIMAL := 0;
  v_weighted_sum DECIMAL := 0;
  v_agent RECORD;
BEGIN
  -- Ağırlık haritası
  FOR v_agent IN
    SELECT
      agent_id,
      parsed_score,
      CASE agent_id
        WHEN 'structure' THEN 0.20
        WHEN 'methodology' THEN 0.30
        WHEN 'writing' THEN 0.25
        WHEN 'references' THEN 0.15
        WHEN 'originality' THEN 0.10
        ELSE 0.10
      END AS weight
    FROM public.agent_results
    WHERE document_id = p_document_id
      AND parsed_score IS NOT NULL
  LOOP
    v_weighted_sum := v_weighted_sum + (v_agent.parsed_score * v_agent.weight);
    v_total_weight := v_total_weight + v_agent.weight;
  END LOOP;

  IF v_total_weight = 0 THEN
    RETURN 50.00;
  END IF;

  RETURN ROUND(v_weighted_sum / v_total_weight, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.3 Kullanıcının günlük analiz sayısını kontrol et
CREATE OR REPLACE FUNCTION public.check_daily_analysis_limit(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.thesis_documents
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  RETURN QUERY SELECT
    v_count < p_limit AS allowed,
    v_count AS current_count,
    GREATEST(0, p_limit - v_count) AS remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.4 Abonelik durumunu kontrol et
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_subscription BOOLEAN,
  plan_id TEXT,
  plan_name TEXT,
  status TEXT,
  period_end TIMESTAMP WITH TIME ZONE,
  features JSONB,
  limits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS has_subscription,
    us.plan_id,
    sp.name AS plan_name,
    us.status,
    us.current_period_end AS period_end,
    sp.features,
    sp.limits
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;

  -- Abonelik yoksa free plan döndür
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      false AS has_subscription,
      'free'::TEXT AS plan_id,
      'Ücretsiz'::TEXT AS plan_name,
      'active'::TEXT AS status,
      NULL::TIMESTAMP WITH TIME ZONE AS period_end,
      sp.features,
      sp.limits
    FROM public.subscription_plans sp
    WHERE sp.id = 'free';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.5 Counter increment helper (profilden)
CREATE OR REPLACE FUNCTION public.increment_counter(
  row_id UUID,
  counter_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_new_value INTEGER;
BEGIN
  EXECUTE format(
    'UPDATE public.profiles SET %I = COALESCE(%I, 0) + 1, last_activity_at = NOW() WHERE id = $1 RETURNING %I',
    counter_name, counter_name, counter_name
  ) INTO v_new_value USING row_id;

  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. REALTIME YAPILANDIRMASI
-- ============================================================================

-- Realtime için thesis_documents tablosunu etkinleştir
-- NOT: Bu Supabase Dashboard'dan yapılmalı veya:
-- Supabase Dashboard > Database > Replication > Source tablosuna thesis_documents ekleyin

-- Alternatif olarak, eğer supabase_realtime schema varsa:
DO $$
BEGIN
  -- Eğer supabase_realtime extension mevcutsa
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_realtime') THEN
    -- Realtime publication'a ekle
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.thesis_documents;
    EXCEPTION WHEN duplicate_object THEN
      NULL;  -- Zaten ekliyse hata verme
    END;
  END IF;
END;
$$;

-- ============================================================================
-- 11. STORAGE BUCKET (Eğer yoksa)
-- ============================================================================

-- NOT: Bu Supabase Dashboard'dan yapılmalı:
-- Storage > New bucket > "thesis-uploads"
-- Public: false
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- File size limit: 15MB

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- Yapılması gerekenler:
-- 1. Bu scripti Supabase SQL Editor'da çalıştırın
-- 2. Dashboard > Database > Replication'da thesis_documents'ı Realtime'a ekleyin
-- 3. .env.local dosyasına yeni environment variables ekleyin:
--    - GOOGLE_AI_API_KEY (Gemini için)
--    - QSTASH_TOKEN
--    - QSTASH_CURRENT_SIGNING_KEY
--    - QSTASH_NEXT_SIGNING_KEY
--    - UPSTASH_REDIS_REST_URL
--    - UPSTASH_REDIS_REST_TOKEN
--    - RESEND_API_KEY (Email için)
--
-- ============================================================================
