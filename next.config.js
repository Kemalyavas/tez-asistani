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

  // --- HATA İÇİN GEREKLİ GÜNCELLEME BURASI ---
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('iyzipay');
    }
    return config;
  },
};

module.exports = nextConfig;