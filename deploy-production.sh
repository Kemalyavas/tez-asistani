#!/bin/bash

# ========================================
# TEZ ASİSTANI - GÜVENLİ DEPLOYMENT SCRIPT
# ========================================

echo "🚀 Tez Asistanı Production Deployment başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hata durumunda çık
set -e

# 1. Ortam kontrolleri
echo -e "${BLUE}📋 Ön kontroller yapılıyor...${NC}"

# Node.js version check
NODE_VERSION=$(node --version)
echo "Node.js sürümü: $NODE_VERSION"

# NPM packages audit
echo -e "${YELLOW}🔍 Güvenlik açıkları taranıyor...${NC}"
npm audit --audit-level high

# 2. Environment variables kontrolü
echo -e "${BLUE}🔐 Environment variables kontrol ediliyor...${NC}"

if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local dosyası bulunamadı!${NC}"
    exit 1
fi

# Kritik environment variables varlığını kontrol et
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY")

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        echo -e "${RED}❌ $var environment variable eksik!${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables tamam${NC}"

# 3. Build test
echo -e "${BLUE}🏗️ Production build test ediliyor...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build başarısız!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build başarılı${NC}"

# 4. TypeScript type check
echo -e "${BLUE}📝 TypeScript kontrolleri yapılıyor...${NC}"
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript hataları bulundu!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TypeScript kontrolleri tamam${NC}"

# 5. Linting
echo -e "${BLUE}🧹 Code quality kontrolleri yapılıyor...${NC}"
npm run lint

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Lint uyarıları bulundu, devam ediliyor...${NC}"
fi

# 6. Güvenlik kontrolleri
echo -e "${BLUE}🔒 Güvenlik kontrolleri yapılıyor...${NC}"

# .env.local'ın git'te olmadığını kontrol et
if git ls-files --error-unmatch .env.local 2>/dev/null; then
    echo -e "${RED}❌ .env.local dosyası git'te tracked! Hemen kaldırın!${NC}"
    exit 1
fi

# Hassas bilgilerin kodda olup olmadığını kontrol et
echo "🔍 Hassas bilgi leakage kontrol ediliyor..."

# API key patterns
if grep -r "sk-" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ 2>/dev/null; then
    echo -e "${RED}❌ API key koda hardcode edilmiş!${NC}"
    exit 1
fi

# Password patterns
if grep -r "password.*=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ 2>/dev/null | grep -v "Password" | grep -v "password:" | grep -v "password?"; then
    echo -e "${RED}❌ Hardcode edilmiş password bulundu!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Güvenlik kontrolleri tamam${NC}"

# 7. Production environment variables oluştur
echo -e "${BLUE}⚙️ Production environment variables hazırlanıyor...${NC}"

# .env.production.example oluştur
cat > .env.production.example << EOF
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
EOF

echo -e "${GREEN}✅ .env.production.example oluşturuldu${NC}"

# 8. Deployment checklist
echo -e "${BLUE}📋 Deployment checklist oluşturuluyor...${NC}"

cat > DEPLOYMENT_CHECKLIST.md << EOF
# 🚀 DEPLOYMENT CHECKLIST

## ✅ Completed Checks
- [x] Build successful
- [x] TypeScript checks passed
- [x] Environment variables present
- [x] No hardcoded secrets
- [x] Security audit passed

## 🔄 Manual Steps Required

### 1. Vercel Deployment
\`\`\`bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
\`\`\`

### 2. Environment Variables Setup
- [ ] Add all environment variables in Vercel dashboard
- [ ] Verify Supabase connection
- [ ] Test API endpoints
- [ ] Verify rate limiting works

### 3. Domain & SSL
- [ ] Configure custom domain
- [ ] Verify SSL certificate
- [ ] Test HTTPS redirects

### 4. Post-Deployment Testing
- [ ] User registration works
- [ ] File upload works  
- [ ] Citation formatting works
- [ ] Abstract generation works
- [ ] Rate limiting works
- [ ] Mobile responsiveness
- [ ] Payment integration (when ready)

### 5. Monitoring Setup
- [ ] Setup error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Setup uptime monitoring
- [ ] Configure alerts

### 6. Security Final Checks
- [ ] OWASP security headers active
- [ ] Rate limiting functional
- [ ] File upload security working
- [ ] Database RLS policies active

## 🆘 Emergency Contacts
- Supabase Dashboard: https://app.supabase.io
- Vercel Dashboard: https://vercel.com/dashboard  
- OpenAI Dashboard: https://platform.openai.com

## 📞 Rollback Plan
\`\`\`bash
# If something goes wrong
vercel rollback [deployment-url]
\`\`\`
EOF

echo -e "${GREEN}✅ Deployment checklist oluşturuldu${NC}"

# 9. Final summary
echo ""
echo -e "${GREEN}🎉 TÜM KONTROLLER BAŞARILI!${NC}"
echo ""
echo -e "${BLUE}📁 Oluşturulan dosyalar:${NC}"
echo "- .env.production.example"
echo "- DEPLOYMENT_CHECKLIST.md"
echo ""
echo -e "${YELLOW}⏭️ Sonraki adımlar:${NC}"
echo "1. OpenAI API key'inizi YENİLEYİN (güvenlik için)"
echo "2. Vercel'de environment variables ekleyin"
echo "3. 'vercel --prod' komutu ile deploy edin"
echo "4. DEPLOYMENT_CHECKLIST.md'deki adımları takip edin"
echo ""
echo -e "${GREEN}🚀 Deployment'a hazır!${NC}"
