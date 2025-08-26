-- ========================================
-- RLS GÜVENLİK HATALARINI DÜZELTME
-- ========================================
-- CSV dosyasından gelen güvenlik hatalarını çözme

-- 1. DOCUMENTS TABLOSU için RLS politikaları
-- Bu tablo PDF/Word yüklemeleri için kullanılıyor olmalı
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    file_type TEXT,
    file_size INTEGER,
    upload_url TEXT,
    processed BOOLEAN DEFAULT FALSE,
    analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents tablosu için RLS etkinleştir
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents RLS politikaları
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 2. CITATIONS TABLOSU için RLS politikaları
-- Bu tablo kaynak formatı geçmişi için kullanılıyor olmalı
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    formatted_citation TEXT NOT NULL,
    citation_style TEXT NOT NULL, -- APA, MLA, Chicago vs.
    source_type TEXT, -- book, journal, website vs.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations tablosu için RLS etkinleştir
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- Citations RLS politikaları
CREATE POLICY "Users can view own citations" ON public.citations
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own citations" ON public.citations
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own citations" ON public.citations
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own citations" ON public.citations
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. ABSTRACTS TABLOSU için RLS politikaları
-- Bu tablo özet oluşturma geçmişi için kullanılıyor olmalı
CREATE TABLE IF NOT EXISTS public.abstracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    generated_abstract TEXT NOT NULL,
    word_count INTEGER,
    language TEXT DEFAULT 'tr',
    model_used TEXT,
    settings JSONB, -- özet uzunluğu, stil vs.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abstracts tablosu için RLS etkinleştir
ALTER TABLE public.abstracts ENABLE ROW LEVEL SECURITY;

-- Abstracts RLS politikaları
CREATE POLICY "Users can view own abstracts" ON public.abstracts
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own abstracts" ON public.abstracts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own abstracts" ON public.abstracts
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own abstracts" ON public.abstracts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. PLAN_LIMITS TABLOSU için RLS politikaları
-- Bu tablo plan limitlerini saklamak için kullanılıyor (zaten mevcut)
-- Mevcut tablo yapısı: id, plan_name, analysis_limit, citation_limit, abstract_limit

-- Plan_limits tablosu için RLS etkinleştir
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Plan limits tüm kullanıcılar tarafından okunabilir (public data)
CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
    FOR SELECT 
    USING (true);

-- Sadece admin/sistem plan limitlerini değiştirebilir
-- Bu policy'yi şu anlık devre dışı bırakıyoruz çünkü admin sistemi yok
-- CREATE POLICY "Admin can manage plan limits" ON public.plan_limits
--     FOR ALL 
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Plan limitleri zaten mevcut (csv'de gördük):
-- free: analysis_limit=1, citation_limit=5, abstract_limit=0
-- pro: analysis_limit=50, citation_limit=50, abstract_limit=50  
-- expert: analysis_limit=-1, citation_limit=-1, abstract_limit=-1

-- ========================================
-- KULLANIM İSTATİSTİKLERİ TABLOSU (bonus)
-- ========================================
-- Kullanıcı kullanım geçmişini daha detaylı takip için
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- document_upload, citation_format, abstract_generate
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs için RLS etkinleştir
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- User activity logs RLS politikaları
CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.user_activity_logs
    FOR INSERT 
    WITH CHECK (true);

-- ========================================
-- İNDEXLER - PERFORMANS İYİLEŞTİRMESİ
-- ========================================

-- Documents tablosu indexleri
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON public.documents(processed);

-- Citations tablosu indexleri
CREATE INDEX IF NOT EXISTS idx_citations_user_id ON public.citations(user_id);
CREATE INDEX IF NOT EXISTS idx_citations_created_at ON public.citations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_style ON public.citations(citation_style);

-- Abstracts tablosu indexleri
CREATE INDEX IF NOT EXISTS idx_abstracts_user_id ON public.abstracts(user_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_created_at ON public.abstracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abstracts_language ON public.abstracts(language);

-- Activity logs indexleri
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.user_activity_logs(activity_type);

-- ========================================
-- KULLANIM LİMİT KONTROL FONKSİYONU (güncellenmiş)
-- ========================================

CREATE OR REPLACE FUNCTION public.check_daily_usage_limit(
    p_user_id UUID, 
    p_feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_status TEXT;
    v_daily_limit INTEGER;
    v_current_usage INTEGER;
BEGIN
    -- Kullanıcının abonelik durumunu al
    SELECT subscription_status INTO v_subscription_status 
    FROM public.profiles 
    WHERE id = p_user_id;

    -- Varsayılan değer
    v_subscription_status := COALESCE(v_subscription_status, 'free');

    -- Mevcut tablo yapısına göre plan limitini al
    CASE p_feature_name
        WHEN 'thesis_analyses' THEN
            SELECT analysis_limit INTO v_daily_limit
            FROM public.plan_limits
            WHERE plan_name = v_subscription_status;
        WHEN 'citation_formats' THEN
            SELECT citation_limit INTO v_daily_limit
            FROM public.plan_limits
            WHERE plan_name = v_subscription_status;
        WHEN 'abstract_generations' THEN
            SELECT abstract_limit INTO v_daily_limit
            FROM public.plan_limits
            WHERE plan_name = v_subscription_status;
        ELSE
            v_daily_limit := 0;
    END CASE;

    -- Eğer limit -1 ise sınırsız
    IF v_daily_limit = -1 THEN
        RETURN TRUE;
    END IF;

    -- Bugünkü kullanım sayısını hesapla
    CASE p_feature_name
        WHEN 'thesis_analyses' THEN
            SELECT COUNT(*) INTO v_current_usage
            FROM public.documents
            WHERE user_id = p_user_id
            AND DATE(created_at) = CURRENT_DATE;
        WHEN 'citation_formats' THEN
            SELECT COUNT(*) INTO v_current_usage
            FROM public.citations
            WHERE user_id = p_user_id
            AND DATE(created_at) = CURRENT_DATE;
        WHEN 'abstract_generations' THEN
            SELECT COUNT(*) INTO v_current_usage
            FROM public.abstracts
            WHERE user_id = p_user_id
            AND DATE(created_at) = CURRENT_DATE;
        ELSE
            v_current_usage := 0;
    END CASE;

    -- Limiti kontrol et
    RETURN v_current_usage < v_daily_limit;
END;
$$;

-- ========================================
-- VERİ TEMİZLEME FONKSİYONLARI
-- ========================================

-- Eski kayıtları temizleme (opsiyonel - storage maliyetini düşürmek için)
CREATE OR REPLACE FUNCTION public.cleanup_old_records()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- 6 aydan eski activity logları sil
    DELETE FROM public.user_activity_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- 1 yıldan eski documents ve içeriklerini sil (çok büyük dosyalar için)
    DELETE FROM public.documents 
    WHERE created_at < NOW() - INTERVAL '1 year';
$$;

-- Bu fonksiyonu otomatik çalıştırmak için pg_cron kullanabilirsiniz (opsiyonel):
-- SELECT cron.schedule('cleanup-old-records', '0 2 * * *', 'SELECT public.cleanup_old_records();');
