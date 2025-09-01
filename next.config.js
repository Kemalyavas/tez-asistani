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

  // Iyzipay resources klasörünü production build'e kopyala
  webpack: (config, { isServer }) => {
    if (isServer) {
      const path = require('path');
      const fs = require('fs');
      
      // İyzipay için gerekli resources klasörünü kopyala
      const CopyWebpackPlugin = require('copy-webpack-plugin');
      const resourcesSource = path.resolve(__dirname, 'iyzipay-resources');
      const resourcesTarget = path.resolve(__dirname, '.next/server/app/api/iyzico/checkout/resources');
      
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: resourcesSource,
              to: resourcesTarget,
            },
          ],
        })
      );
    }
    return config;
  },
  // Bu paket genellikle harici olarak belirtilmesine gerek kalmadan Next.js ile doğru şekilde çalışır.
};

module.exports = nextConfig;
