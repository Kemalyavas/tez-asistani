-- DURUMU KONTROL ET - Tek sorguda her şeyi görelim

-- 1. Profiles tablosunun yapısı
SELECT 'PROFILES COLUMNS' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Plan_limits tablosunun yapısı  
SELECT 'PLAN_LIMITS COLUMNS' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'plan_limits'
ORDER BY ordinal_position;

-- 3. Plan limitleri verisi
SELECT 'PLAN_LIMITS DATA' as info, plan_name, analysis_limit, citation_limit, abstract_limit
FROM public.plan_limits;

-- 4. Profiles tablosundaki kullanıcı verisi (ilk 3 kullanıcı)
SELECT 'PROFILES DATA' as info, id, subscription_status, thesis_count, 
       COALESCE(abstract_count, -999) as abstract_count, 
       COALESCE(citation_count, -999) as citation_count
FROM public.profiles 
LIMIT 3;
