-- ============================================================================
-- TezAI Database Setup Script - Credit-Based System v2.0
-- ============================================================================
-- Supabase SQL Editor'da çalıştırın
-- Bu script yeni kredi bazlı sistemi kurar
-- ============================================================================

-- 0. Gerekli extension'ları etkinleştir
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector for RAG embeddings

-- ============================================================================
-- 1. PROFILES TABLOSU (Kullanıcı bilgileri ve kredi bakiyesi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Kredi Sistemi
  credits INTEGER DEFAULT 10 NOT NULL,  -- Başlangıç: 10 ücretsiz kredi
  total_credits_purchased INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  
  -- Kullanım İstatistikleri
  thesis_analyses_count INTEGER DEFAULT 0,
  abstracts_count INTEGER DEFAULT 0,
  citations_count INTEGER DEFAULT 0,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CREDIT PACKAGES (Satın alınabilir kredi paketleri - referans tablosu)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id TEXT PRIMARY KEY,  -- 'starter', 'standard', 'pro', 'ultimate'
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_usd NUMERIC(10, 2) NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paket verilerini ekle
INSERT INTO public.credit_packages (id, name, credits, price_usd, bonus_credits, description, sort_order) VALUES
  ('starter', 'Starter Pack', 50, 5.00, 0, 'Perfect for trying out TezAI', 1),
  ('standard', 'Standard Pack', 200, 15.00, 40, 'Great value for regular users', 2),
  ('pro', 'Pro Pack', 500, 35.00, 100, 'Best for thesis writers', 3),
  ('ultimate', 'Ultimate Pack', 1200, 75.00, 300, 'Maximum value for power users', 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  price_usd = EXCLUDED.price_usd,
  bonus_credits = EXCLUDED.bonus_credits,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 3. CREDIT COSTS (İşlem başına kredi maliyetleri - referans tablosu)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_costs (
  action_type TEXT PRIMARY KEY,  -- 'citation', 'abstract', 'thesis_basic', etc.
  credits_required INTEGER NOT NULL,
  description TEXT,
  category TEXT,  -- 'citation', 'abstract', 'thesis'
  is_active BOOLEAN DEFAULT true
);

-- Kredi maliyetlerini ekle
INSERT INTO public.credit_costs (action_type, credits_required, description, category) VALUES
  ('citation_format', 1, 'Format a single citation (APA, MLA, Chicago, IEEE)', 'citation'),
  ('abstract_generate', 3, 'Generate thesis abstract (TR/EN)', 'abstract'),
  ('thesis_basic', 10, 'Basic thesis analysis (< 30 pages)', 'thesis'),
  ('thesis_standard', 25, 'Standard thesis analysis (30-60 pages)', 'thesis'),
  ('thesis_comprehensive', 50, 'Comprehensive thesis analysis (60-100+ pages)', 'thesis')
ON CONFLICT (action_type) DO UPDATE SET
  credits_required = EXCLUDED.credits_required,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- ============================================================================
-- 4. CREDIT TRANSACTIONS (Kredi hareketleri geçmişi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- İşlem Detayları
  amount INTEGER NOT NULL,  -- Pozitif: ekleme, Negatif: harcama
  balance_after INTEGER NOT NULL,  -- İşlem sonrası bakiye
  transaction_type TEXT NOT NULL,  -- 'purchase', 'usage', 'refund', 'bonus', 'signup_bonus'
  
  -- İlişkili Bilgiler
  action_type TEXT,  -- 'citation_format', 'abstract_generate', 'thesis_basic', etc.
  description TEXT,
  
  -- Ödeme Bilgileri (sadece purchase için)
  payment_id TEXT,
  package_id TEXT REFERENCES public.credit_packages(id),
  
  -- Zaman Damgası
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. PAYMENT HISTORY (Ödeme geçmişi - Iyzico entegrasyonu)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Iyzico Bilgileri
  payment_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT,
  basket_id TEXT,
  
  -- Paket ve Tutar
  package_id TEXT REFERENCES public.credit_packages(id),
  amount_usd NUMERIC(10, 2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'success', 'failed', 'refunded'
  
  -- Iyzico Response (debug için)
  iyzico_response JSONB,
  error_message TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 6. THESIS DOCUMENTS (Yüklenen tez dökümanları)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thesis_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Döküman Bilgileri
  filename TEXT NOT NULL,
  file_size INTEGER,  -- bytes
  file_type TEXT,  -- 'pdf', 'docx'
  page_count INTEGER,
  word_count INTEGER,
  
  -- Analiz Durumu
  status TEXT DEFAULT 'uploaded',  -- 'uploaded', 'processing', 'analyzed', 'failed'
  analysis_type TEXT,  -- 'basic', 'standard', 'comprehensive'
  credits_used INTEGER,
  
  -- Analiz Sonuçları
  analysis_result JSONB,
  overall_score INTEGER,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- 7. THESIS CHUNKS (RAG için tez parçaları ve embeddings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thesis_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID NOT NULL REFERENCES public.thesis_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Chunk Bilgileri
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  
  -- Embedding (OpenAI text-embedding-3-small: 1536 dimension)
  embedding vector(1536),
  
  -- Metadata
  section_type TEXT,  -- 'abstract', 'introduction', 'literature', 'methodology', 'results', 'conclusion', 'references'
  page_numbers TEXT,  -- '1-3', '15-20' gibi
  metadata JSONB,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================================================
-- 8. INDEXES (Performans optimizasyonu)
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles(credits);

-- Credit Transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);

-- Payment History
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON public.payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);

-- Thesis Documents
CREATE INDEX IF NOT EXISTS idx_thesis_documents_user_id ON public.thesis_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_documents_status ON public.thesis_documents(status);
CREATE INDEX IF NOT EXISTS idx_thesis_documents_expires_at ON public.thesis_documents(expires_at);

-- Thesis Chunks
CREATE INDEX IF NOT EXISTS idx_thesis_chunks_thesis_id ON public.thesis_chunks(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_chunks_user_id ON public.thesis_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_chunks_expires_at ON public.thesis_chunks(expires_at);
CREATE INDEX IF NOT EXISTS idx_thesis_chunks_section_type ON public.thesis_chunks(section_type);

-- Vector similarity search index (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_thesis_chunks_embedding ON public.thesis_chunks 
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_chunks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Credit Packages (herkes okuyabilir)
CREATE POLICY "Anyone can view credit packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- Credit Costs (herkes okuyabilir)
CREATE POLICY "Anyone can view credit costs" ON public.credit_costs
  FOR SELECT USING (is_active = true);

-- Credit Transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment History
CREATE POLICY "Users can view own payments" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Thesis Documents
CREATE POLICY "Users can view own documents" ON public.thesis_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.thesis_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.thesis_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.thesis_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Thesis Chunks
CREATE POLICY "Users can view own chunks" ON public.thesis_chunks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chunks" ON public.thesis_chunks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chunks" ON public.thesis_chunks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 10.1 Yeni kullanıcı kaydı trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profil oluştur
  INSERT INTO public.profiles (id, email, username, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    10  -- Başlangıç bonusu: 10 kredi
  );
  
  -- Bonus kredi işlemini kaydet
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description)
  VALUES (
    NEW.id,
    10,
    10,
    'signup_bonus',
    'Welcome bonus - 10 free credits'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur (varsa önce sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10.2 Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_payment_history_updated_at ON public.payment_history;
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10.3 Kredi harcama fonksiyonu (atomic işlem)
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Mevcut bakiyeyi kilitle ve al
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Kullanıcı bulunamadı
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;
  
  -- Yetersiz bakiye
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  
  -- Krediyi düş
  v_new_balance := v_current_balance - p_amount;
  
  UPDATE public.profiles
  SET 
    credits = v_new_balance,
    total_credits_used = total_credits_used + p_amount,
    last_activity_at = NOW()
  WHERE id = p_user_id;
  
  -- İşlemi kaydet
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, action_type, description)
  VALUES (p_user_id, -p_amount, v_new_balance, 'usage', p_action_type, p_description);
  
  -- Kullanım sayacını güncelle
  IF p_action_type LIKE 'thesis%' THEN
    UPDATE public.profiles SET thesis_analyses_count = thesis_analyses_count + 1 WHERE id = p_user_id;
  ELSIF p_action_type = 'abstract_generate' THEN
    UPDATE public.profiles SET abstracts_count = abstracts_count + 1 WHERE id = p_user_id;
  ELSIF p_action_type = 'citation_format' THEN
    UPDATE public.profiles SET citations_count = citations_count + 1 WHERE id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.4 Kredi ekleme fonksiyonu (satın alma sonrası)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_bonus INTEGER DEFAULT 0,
  p_payment_id TEXT DEFAULT NULL,
  p_package_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_total_amount INTEGER;
BEGIN
  v_total_amount := p_amount + p_bonus;
  
  -- Mevcut bakiyeyi al
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;
  
  v_new_balance := v_current_balance + v_total_amount;
  
  -- Krediyi ekle
  UPDATE public.profiles
  SET 
    credits = v_new_balance,
    total_credits_purchased = total_credits_purchased + v_total_amount,
    last_activity_at = NOW()
  WHERE id = p_user_id;
  
  -- Ana kredi işlemini kaydet
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, payment_id, package_id, description)
  VALUES (p_user_id, p_amount, v_current_balance + p_amount, 'purchase', p_payment_id, p_package_id, 
    'Purchased ' || p_amount || ' credits');
  
  -- Bonus varsa ayrı kaydet
  IF p_bonus > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, payment_id, package_id, description)
    VALUES (p_user_id, p_bonus, v_new_balance, 'bonus', p_payment_id, p_package_id,
      'Bonus credits from ' || COALESCE(p_package_id, 'purchase'));
  END IF;
  
  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.5 Benzer chunk'ları bul (RAG için vector search)
CREATE OR REPLACE FUNCTION public.search_similar_chunks(
  p_thesis_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  content TEXT,
  section_type TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.content,
    tc.section_type,
    1 - (tc.embedding <=> p_query_embedding) AS similarity
  FROM public.thesis_chunks tc
  WHERE tc.thesis_id = p_thesis_id
    AND tc.embedding IS NOT NULL
    AND 1 - (tc.embedding <=> p_query_embedding) > p_threshold
  ORDER BY tc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.6 Süresi dolmuş verileri temizle
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Süresi dolmuş thesis dökümanlarını sil
  DELETE FROM public.thesis_documents
  WHERE expires_at < NOW();
  
  -- Süresi dolmuş chunk'ları sil
  DELETE FROM public.thesis_chunks
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. VIEWS (Kullanışlı görünümler)
-- ============================================================================

-- Kullanıcı dashboard verileri
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id,
  p.email,
  p.username,
  p.credits,
  p.total_credits_purchased,
  p.total_credits_used,
  p.thesis_analyses_count,
  p.abstracts_count,
  p.citations_count,
  p.created_at,
  p.last_activity_at,
  (
    SELECT COUNT(*) 
    FROM public.thesis_documents td 
    WHERE td.user_id = p.id AND td.status = 'analyzed'
  ) AS total_analyses,
  (
    SELECT json_agg(json_build_object(
      'id', ct.id,
      'amount', ct.amount,
      'type', ct.transaction_type,
      'action', ct.action_type,
      'date', ct.created_at
    ) ORDER BY ct.created_at DESC)
    FROM (
      SELECT * FROM public.credit_transactions 
      WHERE user_id = p.id 
      ORDER BY created_at DESC 
      LIMIT 10
    ) ct
  ) AS recent_transactions
FROM public.profiles p;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Sonraki adımlar:
-- 1. Supabase Dashboard > Settings > API'den URL ve keys'leri alın
-- 2. .env.local dosyasını güncelleyin
-- 3. Auth > Email Templates'i özelleştirin (opsiyonel)
-- 4. Edge Functions veya Cron Jobs ile cleanup_expired_data() çağırın
--
-- ============================================================================
