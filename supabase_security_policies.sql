-- ========================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLİTİKALARI  
-- ========================================

-- Users tablosu oluşturma
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    membership_type TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_membership_type CHECK (membership_type IN ('free', 'pro', 'enterprise'))
);

-- Profiles tablosu oluşturma (eğer henüz oluşturulmadıysa)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    university TEXT,
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs tablosu oluşturma
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    service_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles tablosu için RLS politikaları
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (eğer varsa)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Kullanıcılar sadece kendi profillerini oluşturabilir
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Users tablosu için RLS politikaları
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kullanıcı bilgilerini görebilir
CREATE POLICY "Users can view own user data" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Kullanıcılar sadece kendi kullanıcı bilgilerini güncelleyebilir
CREATE POLICY "Users can update own user data" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Usage_logs tablosu için RLS politikaları
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kullanım loglarını görebilir
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi kullanım loglarını ekleyebilir
CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Service kullanımı için özel politika (API endpoints)
CREATE POLICY "Service can insert usage logs" ON public.usage_logs
    FOR INSERT 
    WITH CHECK (true);

-- Güvenlik fonksiyonları
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID, p_service_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_membership_type TEXT;
    v_usage_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Kullanıcının üyelik tipini al
    SELECT membership_type INTO v_membership_type 
    FROM public.users 
    WHERE id = p_user_id;

    -- Hizmet tipine ve üyelik tipine göre limiti belirle
    v_limit := CASE 
        WHEN p_service_type = 'citation' THEN 
            CASE 
                WHEN v_membership_type = 'free' THEN 5
                WHEN v_membership_type = 'pro' THEN 50
                ELSE 999999
            END
        WHEN p_service_type = 'abstract' THEN
            CASE 
                WHEN v_membership_type = 'free' THEN 3
                WHEN v_membership_type = 'pro' THEN 25
                ELSE 999999
            END
        ELSE 0
    END;

    -- Günlük kullanım sayısını hesapla
    SELECT COUNT(*) INTO v_usage_count
    FROM public.usage_logs 
    WHERE user_id = p_user_id 
    AND service_type = p_service_type
    AND DATE(created_at) = CURRENT_DATE;

    -- Limiti kontrol et
    RETURN v_usage_count < v_limit;
END;
$$;

-- Rate limiting tablosu (opsiyonel - database tabanlı rate limiting için)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address, endpoint, window_start)
);

-- Rate limits tablosu için RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Sadece sistem rate limit kayıtlarını ekleyebilir
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL 
    USING (true);

-- Eski kayıtları temizleme fonksiyonu
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
$$;