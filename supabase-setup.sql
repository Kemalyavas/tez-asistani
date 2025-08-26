-- Supabase Profiles tablosuna kullanım sayacı sütunları ekleme
-- SQL Editor'da çalıştırılacak komutlar

-- 1. Önce mevcut tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Citation count sütunu ekle (varsayılan değer 0)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;

-- 3. Abstract count sütunu ekle (varsayılan değer 0)  
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS abstract_count INTEGER DEFAULT 0;

-- 4. Subscription status sütunu ekle (henüz yoksa)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';

-- 5. Subscription status için check constraint ekle
ALTER TABLE profiles 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('free', 'pro', 'expert'));

-- 6. Mevcut kullanıcılar için varsayılan değerleri güncelle
UPDATE profiles 
SET citation_count = 0, 
    abstract_count = 0,
    subscription_status = 'free' 
WHERE citation_count IS NULL 
   OR abstract_count IS NULL 
   OR subscription_status IS NULL;

-- 7. Güncellenmiş tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
