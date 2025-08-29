/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizasyonları
  productionBrowserSourceMaps: false, // Tarayıcıda kaynak haritalarını kapatarak kodunuzun okunmasını zorlaştırır.
  poweredByHeader: false, // Next.js reklamını kaldırarak potansiyel saldırı yüzeyini azaltır.
  
  // Güvenlik başlıkları: Sitenizi yaygın web saldırılarına karşı korur.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Sitenizin başka bir site içine gömülmesini (iframe) engeller.
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Tarayıcının içerik türünü "tahmin etmesini" engeller.
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Başka sitelere giderken hangi bilgilerin gönderileceğini kısıtlar.
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Siteler arası betik çalıştırma (XSS) saldırılarını engeller.
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Kamera, mikrofon gibi hassas izinleri kısıtlar.
          },
        ],
      },
    ]
  },
  
  // Ortam değişkenlerini kontrol et (isteğe bağlı, build sırasında kontrol için)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;