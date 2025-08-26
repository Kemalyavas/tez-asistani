-- En önemli güvenlik iyileştirmesi: Leaked Password Protection
-- Bu, kullanıcıların bilinen sızdırılmış şifreleri kullanmasını engeller

-- Supabase Auth konfigürasyonunda leaked password protection'ı etkinleştir
-- Bu ayar Supabase Dashboard > Authentication > Settings > Security kısmından yapılır

-- Alternatif olarak SQL ile yapmak için:
-- (Not: Bu ayar genellikle Dashboard'dan yapılır, ama SQL ile de mümkün)

UPDATE auth.config 
SET leaked_password_protection = true
WHERE parameter = 'security';
