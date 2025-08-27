-- Plan limitlerini resimde gösterilen değerlerle güncelle

-- Free plan limitlerini güncelle
UPDATE public.plan_limits SET 
    analysis_limit = 1,     -- 1 tez analizi
    citation_limit = 5,     -- 5 kaynak formatlama
    abstract_limit = 1      -- 1 özet oluşturma
WHERE plan_name = 'free';

-- Pro plan limitlerini güncelle  
UPDATE public.plan_limits SET 
    analysis_limit = 50,    -- 50 tez analizi
    citation_limit = 100,   -- 100 kaynak formatlama
    abstract_limit = 20     -- 20 özet oluşturma
WHERE plan_name = 'pro';

-- Expert plan limitlerini güncelle (sınırsız)
UPDATE public.plan_limits SET 
    analysis_limit = -1,    -- Sınırsız tez analizi
    citation_limit = -1,    -- Sınırsız kaynak formatlama
    abstract_limit = -1     -- Sınırsız özet oluşturma
WHERE plan_name = 'expert';

-- Güncellenmiş değerleri kontrol et
SELECT plan_name, analysis_limit, citation_limit, abstract_limit 
FROM public.plan_limits 
ORDER BY 
    CASE plan_name 
        WHEN 'free' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'expert' THEN 3 
    END;
