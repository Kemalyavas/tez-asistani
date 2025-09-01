const path = require('path');
const fs = require('fs');
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizasyonları
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Güvenlik başlıkları
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  
  // Ortam değişkenleri
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Not: 'iyzipay' için webpack externals yapılandırması kaldırıldı.
  // Bu paket genellikle harici olarak belirtilmesine gerek kalmadan Next.js ile doğru şekilde çalışır.
  // Bu paket genellikle harici olarak belirtilmesine gerek kalmadan Next.js ile doğru şekilde çalışır.
};

module.exports = nextConfig;
