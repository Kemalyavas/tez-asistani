import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.tezai.com.tr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth',
          '/profile',
          '/payment/',
          '/admin/',
          '/private/',
          '/dashboard/',
          '/user/',
          '/tmp/',
        ],
      },
      // Specific bot rules (optional)
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: 'Yandex',
        allow: '/',
      },
      // You can optionally block overly aggressive bots here
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
    ],
    host: baseUrl,
  }
}
