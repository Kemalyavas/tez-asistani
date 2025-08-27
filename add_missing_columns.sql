-- Profiles tablosuna eksik sütunları ekle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS abstract_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;

-- Kontrol et
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('thesis_count', 'abstract_count', 'citation_count', 'subscription_status');
