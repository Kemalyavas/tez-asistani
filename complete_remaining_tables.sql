-- 2. CITATIONS TABLOSU
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    formatted_citation TEXT NOT NULL,
    citation_style TEXT NOT NULL,
    source_type TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_citations_user_id ON public.citations(user_id);
CREATE INDEX IF NOT EXISTS idx_citations_created_at ON public.citations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_style ON public.citations(citation_style);

CREATE POLICY "Users can view own citations" ON public.citations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own citations" ON public.citations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own citations" ON public.citations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own citations" ON public.citations
    FOR DELETE USING (auth.uid() = user_id);

-- 3. ABSTRACTS TABLOSU
CREATE TABLE IF NOT EXISTS public.abstracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    generated_abstract TEXT NOT NULL,
    word_count INTEGER,
    language TEXT DEFAULT 'tr',
    model_used TEXT,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.abstracts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_abstracts_user_id ON public.abstracts(user_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_created_at ON public.abstracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abstracts_language ON public.abstracts(language);

CREATE POLICY "Users can view own abstracts" ON public.abstracts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own abstracts" ON public.abstracts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own abstracts" ON public.abstracts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own abstracts" ON public.abstracts
    FOR DELETE USING (auth.uid() = user_id);

-- 4. PLAN_LIMITS RLS (zaten mevcut tablo)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
    FOR SELECT USING (true);
