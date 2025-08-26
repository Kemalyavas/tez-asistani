-- Mevcut tabloları ve yapılarını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'citations', 'abstracts', 'plan_limits')
ORDER BY table_name, ordinal_position;

-- Plan_limits tablosunda hangi sütunlar var kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plan_limits';

-- Eğer tablo varsa içeriğini göster
SELECT * FROM public.plan_limits LIMIT 5;
