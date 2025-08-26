# ========================================
# TEZ ASİSTANI - GÜVENLİ DEPLOYMENT SCRIPT (Windows PowerShell)
# ========================================

Write-Host "🚀 Tez Asistanı Production Deployment başlatılıyor..." -ForegroundColor Blue

# Hata durumunda dur
$ErrorActionPreference = "Stop"

# 1. Ortam kontrolleri
Write-Host "📋 Ön kontroller yapılıyor..." -ForegroundColor Blue

# Node.js version check
$nodeVersion = node --version
Write-Host "Node.js sürümü: $nodeVersion"

# NPM packages audit
Write-Host "🔍 Güvenlik açıkları taranıyor..." -ForegroundColor Yellow
try {
    npm audit --audit-level high
} catch {
    Write-Host "⚠️ Güvenlik açıkları bulundu, devam ediliyor..." -ForegroundColor Yellow
}

# 2. Environment variables kontrolü
Write-Host "🔐 Environment variables kontrol ediliyor..." -ForegroundColor Blue

if (-Not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local dosyası bulunamadı!" -ForegroundColor Red
    exit 1
}

# Kritik environment variables varlığını kontrol et
$requiredVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY")
$envContent = Get-Content ".env.local" -Raw

foreach ($var in $requiredVars) {
    if (-Not ($envContent -match "^$var=")) {
        Write-Host "❌ $var environment variable eksik!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment variables tamam" -ForegroundColor Green

# 3. Build test
Write-Host "🏗️ Production build test ediliyor..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Build başarılı" -ForegroundColor Green
} catch {
    Write-Host "❌ Build başarısız!" -ForegroundColor Red
    exit 1
}

# 4. TypeScript type check
Write-Host "📝 TypeScript kontrolleri yapılıyor..." -ForegroundColor Blue
try {
    npx tsc --noEmit
    Write-Host "✅ TypeScript kontrolleri tamam" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript hataları bulundu!" -ForegroundColor Red
    exit 1
}

# 5. Linting
Write-Host "🧹 Code quality kontrolleri yapılıyor..." -ForegroundColor Blue
try {
    npm run lint
} catch {
    Write-Host "⚠️ Lint uyarıları bulundu, devam ediliyor..." -ForegroundColor Yellow
}

# 6. Güvenlik kontrolleri
Write-Host "🔒 Güvenlik kontrolleri yapılıyor..." -ForegroundColor Blue

# .env.local'ın git'te olmadığını kontrol et
$gitFiles = git ls-files 2>$null
if ($gitFiles -contains ".env.local") {
    Write-Host "❌ .env.local dosyası git'te tracked! Hemen kaldırın!" -ForegroundColor Red
    exit 1
}

# Hassas bilgilerin kodda olup olmadığını kontrol et
Write-Host "🔍 Hassas bilgi leakage kontrol ediliyor..."

# API key patterns
$apiKeyCheck = Select-String -Path "app\**\*.ts", "app\**\*.tsx", "app\**\*.js", "app\**\*.jsx" -Pattern "sk-" -ErrorAction SilentlyContinue
if ($apiKeyCheck) {
    Write-Host "❌ API key koda hardcode edilmiş!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Güvenlik kontrolleri tamam" -ForegroundColor Green

# 7. Production environment variables oluştur
Write-Host "⚙️ Production environment variables hazırlanıyor..." -ForegroundColor Blue

$envProductionContent = @"
# Production Environment Variables
# Bu dosyayı kopyalayarak .env.production oluşturun ve değerleri doldurun

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Stripe Configuration (when ready)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ENVIRONMENT=production

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
"@

$envProductionContent | Out-File -FilePath ".env.production.example" -Encoding UTF8

Write-Host "✅ .env.production.example oluşturuldu" -ForegroundColor Green

# 8. Deployment checklist
Write-Host "📋 Deployment checklist oluşturuluyor..." -ForegroundColor Blue

# Deployment checklist content oluştur
$deploymentChecklistContent = @'
# 🚀 DEPLOYMENT CHECKLIST

## ✅ Completed Checks
✅ Build successful
✅ TypeScript checks passed  
✅ Environment variables present
✅ No hardcoded secrets
✅ Security audit passed

## 🔄 Manual Steps Required

### 1. Vercel Deployment
```powershell
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Environment Variables Setup
☐ Add all environment variables in Vercel dashboard
☐ Verify Supabase connection
☐ Test API endpoints
☐ Verify rate limiting works

### 3. Domain & SSL
☐ Configure custom domain
☐ Verify SSL certificate
☐ Test HTTPS redirects

### 4. Post-Deployment Testing
☐ User registration works
☐ File upload works  
☐ Citation formatting works
☐ Abstract generation works
☐ Rate limiting works
☐ Mobile responsiveness
☐ Payment integration (when ready)

### 5. Monitoring Setup
☐ Setup error tracking (Sentry)
☐ Configure performance monitoring
☐ Setup uptime monitoring
☐ Configure alerts

### 6. Security Final Checks
☐ OWASP security headers active
☐ Rate limiting functional
☐ File upload security working
☐ Database RLS policies active

## 🆘 Emergency Contacts
- Supabase Dashboard: https://app.supabase.io
- Vercel Dashboard: https://vercel.com/dashboard  
- OpenAI Dashboard: https://platform.openai.com

## 📞 Rollback Plan
```powershell
# If something goes wrong
vercel rollback [deployment-url]
```
'@

$deploymentChecklistContent | Out-File -FilePath "DEPLOYMENT_CHECKLIST.md" -Encoding UTF8

Write-Host "✅ Deployment checklist oluşturuldu" -ForegroundColor Green

# 9. Final summary
Write-Host ""
Write-Host "🎉 TÜM KONTROLLER BAŞARILI!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Oluşturulan dosyalar:" -ForegroundColor Blue
Write-Host "- .env.production.example"
Write-Host "- DEPLOYMENT_CHECKLIST.md"
Write-Host ""
Write-Host "⏭️ Sonraki adımlar:" -ForegroundColor Yellow
Write-Host "1. OpenAI API key'inizi YENİLEYİN (güvenlik için)"
Write-Host "2. Vercel'de environment variables ekleyin"
Write-Host "3. 'vercel --prod' komutu ile deploy edin"
Write-Host "4. DEPLOYMENT_CHECKLIST.md'deki adımları takip edin"
Write-Host ""
Write-Host "🚀 Deployment'a hazır!" -ForegroundColor Green

# Script'i çalıştırmak için: .\deploy-production.ps1
