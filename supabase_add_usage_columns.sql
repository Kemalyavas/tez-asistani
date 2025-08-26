-- Profiles tablosuna kullanım sayaçlarını ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS abstract_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;

-- Mevcut kullanıcılar için default değerleri ayarla
UPDATE profiles SET abstract_count = 0 WHERE abstract_count IS NULL;
UPDATE profiles SET citation_count = 0 WHERE citation_count IS NULL;
