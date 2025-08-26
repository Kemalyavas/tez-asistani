# ===========================================

# VERCEL ENVIRONMENT VARIABLES SETUP

# ===========================================

# Bu dosyayı Vercel dashboard'da Environment Variables bölümüne ekleyin

# CRITICAL: Bu değerleri Vercel'de manual olarak girin!

# .env.local dosyasındaki değerleri kesinlikle GitHub'a upload etmeyin!

# Supabase Configuration

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI Configuration (YENİ API KEY GEREKLİ!)

OPENAI_API_KEY=

# Application Configuration

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production

# Security Keys (Generate new ones!)

JWT_SECRET=
ENCRYPTION_KEY=

# Analytics (Optional)

NEXT_PUBLIC_GA_ID=
VERCEL_ANALYTICS_ID=

# Error Tracking (Recommended)

SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# ===========================================

# VERCEL DEPLOYMENT ENVIRONMENT SETTINGS

# ===========================================

# Production Environment:

# - Tüm yukarıdaki değişkenleri ekleyin

# - Environment: Production

# - Git Branch: main

# Preview Environment:

# - Test değerleri kullanın

# - Environment: Preview

# - Git Branch: All branches

# Development Environment:

# - Local development değerleri

# - Environment: Development

# - Git Branch: None

# ===========================================

# DEPLOYMENT COMMANDS

# ===========================================

# 1. Vercel CLI kurulu değilse:

# npm i -g vercel

# 2. Login:

# vercel login

# 3. Project'i link et:

# vercel

# 4. Environment variables ekle:

# Vercel dashboard'da manuel olarak ekleyin

# 5. Production deploy:

# vercel --prod

# ===========================================

# POST-DEPLOYMENT VERIFICATION

# ===========================================

# ✅ Kontrol edilecekler:

# - Site açılıyor mu?

# - Authentication çalışıyor mu?

# - API endpoints response veriyor mu?

# - Rate limiting aktif mi?

# - File upload çalışıyor mu?

# - Database connection var mı?

# - HTTPS redirect çalışıyor mu?

# - Mobile responsive mi?

# 🔍 Test URL'leri:

# https://your-domain.vercel.app

# https://your-domain.vercel.app/auth

# https://your-domain.vercel.app/profile

# https://your-domain.vercel.app/api/format-citation

# https://your-domain.vercel.app/api/abstract-generator
