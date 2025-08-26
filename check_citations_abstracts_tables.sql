-- Mevcut citations ve abstracts tablolarının yapılarını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('citations', 'abstracts')
ORDER BY table_name, ordinal_position;

-- Citations tablosu var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'citations'
);

-- Abstracts tablosu var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'abstracts'
);

-- Eğer tablolar varsa içeriklerini göster
SELECT * FROM public.citations LIMIT 3;
SELECT * FROM public.abstracts LIMIT 3;
