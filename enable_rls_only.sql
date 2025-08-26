-- Sadece RLS politikalarını etkinleştir (tablolar zaten var)

-- CITATIONS tablosu için RLS
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- Citations için basit RLS politikaları (sütun isimlerini varsayarak)
DROP POLICY IF EXISTS "Users can view own citations" ON public.citations;
DROP POLICY IF EXISTS "Users can insert own citations" ON public.citations;
DROP POLICY IF EXISTS "Users can update own citations" ON public.citations;
DROP POLICY IF EXISTS "Users can delete own citations" ON public.citations;

CREATE POLICY "Users can view own citations" ON public.citations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own citations" ON public.citations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own citations" ON public.citations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own citations" ON public.citations
    FOR DELETE USING (auth.uid() = user_id);

-- ABSTRACTS tablosu için RLS
ALTER TABLE public.abstracts ENABLE ROW LEVEL SECURITY;

-- Abstracts için basit RLS politikaları
DROP POLICY IF EXISTS "Users can view own abstracts" ON public.abstracts;
DROP POLICY IF EXISTS "Users can insert own abstracts" ON public.abstracts;
DROP POLICY IF EXISTS "Users can update own abstracts" ON public.abstracts;
DROP POLICY IF EXISTS "Users can delete own abstracts" ON public.abstracts;

CREATE POLICY "Users can view own abstracts" ON public.abstracts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own abstracts" ON public.abstracts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own abstracts" ON public.abstracts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own abstracts" ON public.abstracts
    FOR DELETE USING (auth.uid() = user_id);

-- PLAN_LIMITS için RLS (zaten mevcut tablo)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan limits" ON public.plan_limits;
CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
    FOR SELECT USING (true);
