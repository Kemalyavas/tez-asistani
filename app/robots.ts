import { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from './lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth',
          '/profile',
          '/analyses',
          '/payment/',
          '/admin/',
          '/private/',
          '/dashboard/',
          '/user/',
          '/tmp/',
        ],
      },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'Yandex', allow: '/' },
    ],
    sitemap: [absoluteUrl('/sitemap.xml')],
    host: SITE_URL,
  }
}
