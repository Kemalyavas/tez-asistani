/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizasyonları
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Güvenlik başlıkları
  async headers() {
    // CSP: Report-Only ile başla - canlı siteyi bozmadan hangi kaynakların engellendiğini gör
    // Birkaç gün izledikten sonra Content-Security-Policy-Report-Only → Content-Security-Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com",
      "frame-src 'self' https://sandbox-cpp.iyzipay.com https://cpp.iyzipay.com",
      "form-action 'self' https://sandbox-api.iyzipay.com https://api.iyzipay.com",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: 2 yıl, subdomain'ler dahil, HSTS preload list'e uygun
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP report-only modunda başlıyor - enforcing'e almadan önce prod'da test edilmeli
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
  
  // Ortam değişkenleri
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // --- HATA İÇİN GEREKLİ GÜNCELLEME BURASI ---
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('iyzipay');
    }
    return config;
  },
};

module.exports = nextConfig;