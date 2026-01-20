# TezAI - Claude Code Proje Rehberi

## Proje Özeti
TezAI, akademik tez yazarlarına yardımcı olan yapay zeka destekli bir platformdur. Tez analizi, özet oluşturma ve kaynak formatlama özellikleri sunar.

## Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript 5
- **UI**: React 18 + Tailwind CSS 3.3
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **AI Servisleri**:
  - Anthropic Claude (tez analizi)
  - OpenAI GPT-4 (kaynak formatlama)
- **Ödeme**: Iyzipay (Türk ödeme altyapısı)
- **Dosya İşleme**: pdf-parse, mammoth (DOCX)

## Kritik Kurallar

### Admin Sistemi (ÖNEMLİ!)
**Admin kullanıcı:** kemalyavaas@outlook.com (ID: 90bc0065-4115-4730-8c00-12c74b4f8748)

**Admin Özellikleri:**
- Sınırsız kredi (999999 görünür)
- Hiçbir işlem için kredi düşmez
- Tüm rate limit'ler bypass edilir
- `adminUtils.ts` içinde `isAdmin()` fonksiyonu ile kontrol edilir

**Admin Kontrolü Yapılan Yerler:**
- `useCredits` hook - checkCredits ve useCreditsForAction
- API route'ları - analyze, format-citation, generate-abstract
- UI componentleri - sınırsız görünür

### Kredi Sistemi (ÖNEMLİ!)
Proje **kredi tabanlı** sistem kullanıyor. Eski abonelik sistemi **KALDIRILDI**.

**YAPILMAMASI GEREKENLER:**
- `subscription_status`, `subscription_plan` gibi alanları kullanma
- "Pro plan", "Expert plan", "aylık üyelik" gibi ifadeler kullanma
- `useUserLimits` hook'unu kullanma (deprecated)

**YAPILMASI GEREKENLER:**
- Kredi işlemleri için `useCredits` hook'unu kullan
- Ödeme sonrası `add_credits()` RPC fonksiyonunu çağır
- UI'da "kredi" terminolojisi kullan
- Admin kontrolü için `isAdmin(userId)` kullan

### Kredi Maliyetleri (pricing.ts)
```
citation_format: 1 kredi
abstract_generate: 3 kredi
thesis_basic (1-30 sayfa): 10 kredi
thesis_standard (31-60 sayfa): 25 kredi
thesis_comprehensive (61+ sayfa): 50 kredi
```

### Kredi Paketleri
- Starter: 50 kredi - $5
- Standard: 200+40 bonus - $15
- Pro: 500+100 bonus - $35
- Ultimate: 1200+300 bonus - $75

## Önemli Dosyalar ve Yapı

```
app/
├── api/
│   ├── analyze/           # Tez analizi API
│   ├── abstract/          # Özet oluşturma API
│   ├── citation/          # Kaynak formatlama API
│   └── iyzico/
│       ├── initiate/      # Ödeme başlatma
│       ├── callback/      # Ödeme dönüşü
│       ├── verify-payment/ # Ödeme doğrulama
│       └── webhook/       # Iyzipay webhook (kredi ekleme)
├── components/
│   ├── FileUploader.tsx   # Tez yükleme
│   ├── AbstractGenerator.tsx
│   └── CitationFormatter.tsx
├── hooks/
│   ├── useCredits.ts      # ✅ AKTİF - Kredi yönetimi
│   └── useUserLimits.ts   # ❌ DEPRECATED - Kullanma!
├── lib/
│   ├── pricing.ts         # Kredi paketleri ve maliyetler
│   ├── adminUtils.ts      # Admin kontrolleri
│   └── supabase.ts        # Supabase client
├── profile/               # Kullanıcı profili
├── pricing/               # Fiyatlandırma sayfası
└── payment/
    ├── success/           # Başarılı ödeme
    ├── fail/              # Başarısız ödeme (hata detayları)
    └── status/            # Ödeme durumu (verify-payment yönlendirmesi)
```

## Database Şeması (Supabase)

### profiles tablosu
```sql
id: uuid (FK to auth.users)
email: text
full_name: text
credits: integer (DEFAULT 10)  -- Mevcut kredi
total_credits_purchased: integer
total_credits_used: integer
thesis_analyses_count: integer
abstracts_count: integer
citations_count: integer
created_at: timestamp
updated_at: timestamp
```

### payment_history tablosu
```sql
id: uuid
user_id: uuid (FK to profiles)
payment_id: text (Iyzipay'den)
package_id: text
credits_added: integer
bonus_credits: integer
amount: decimal
status: text ('pending', 'success', 'failed')
created_at: timestamp
```

### RPC Fonksiyonları
- `add_credits(p_user_id, p_amount, p_bonus, p_payment_id, p_package_id)` - Kredi ekle
- `use_credits(p_user_id, p_amount, p_action_type)` - Kredi kullan

## API Endpoint'leri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/analyze` | POST | Tez analizi (FormData ile dosya) |
| `/api/abstract` | POST | Özet oluşturma |
| `/api/citation` | POST | Kaynak formatlama |
| `/api/iyzico/initiate` | POST | Ödeme başlat |
| `/api/iyzico/callback` | POST | Iyzipay callback |
| `/api/iyzico/verify-payment` | POST | Ödeme doğrula |
| `/api/iyzico/webhook` | POST | Webhook (kredi ekle) |

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Iyzipay
IYZIPAY_API_KEY=
IYZIPAY_SECRET_KEY=
IYZIPAY_BASE_URL=

# App
NEXT_PUBLIC_BASE_URL=
```

## Geliştirme Komutları

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint kontrolü
```

## Dikkat Edilecek Noktalar

1. **Dosya boyutu limiti**: 10MB (FileUploader.tsx)
2. **Admin kullanıcıları**: `adminUtils.ts` içinde tanımlı, sınırsız erişim
3. **Dil**: UI İngilizce, kod yorumları Türkçe olabilir
4. **Para birimi**: USD ($)
5. **Ödeme Idempotency**: Çift kredi eklemeyi önlemek için tüm ödeme route'larında kontrol var:
   - `callback`, `webhook`, `verify-payment` → `payment_id` VEYA `conversation_id` ile kontrol
   - Checkout'ta token, sonra gerçek paymentId'ye güncelleniyor
6. **Embedding**: pgvector için array direkt gönderilmeli, `JSON.stringify()` kullanılmamalı

## Yaygın Hatalar ve Çözümleri

| Hata | Çözüm |
|------|-------|
| "Insufficient credits" | Kullanıcıyı /pricing'e yönlendir |
| Webhook duplicate | payment_history'de payment_id kontrolü var |
| Auth hatası | Supabase session kontrolü, /auth'a yönlendir |

## Test Kullanıcıları

Admin kullanıcıları için `app/lib/adminUtils.ts` dosyasına bakın.
