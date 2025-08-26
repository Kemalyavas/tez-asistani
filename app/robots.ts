import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tez-asistani.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/auth',
          '/privacy-policy',
          '/hakkimizda',
          '/iletisim',
          '/sss',
          '/blog/',
          '/ozellikler/',
          '/akademik-formatlar/',
          '/universitelere-ozel/',
        ],
        disallow: [
          '/api/',
          '/profile',
          '/payment/',
          '/_next/',
          '/admin/',
          '*.json',
          '/private/',
          '/dashboard/',
          '/user/',
          '/tmp/',
        ],
        crawlDelay: 1,
      },
      // Özel bot kuralları
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        crawlDelay: 2,
      },
      // Kötü botları engelle
      {
        userAgent: [
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
          'BLEXBot',
          'PetalBot'
        ],
        disallow: '/',
      }
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
    ],
    host: baseUrl,
  }
}
