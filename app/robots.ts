import { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from './lib/site'

export default function robots(): MetadataRoute.Robots {
  // Tek '*' grubu kullanılıyor. Bot'a özel allow:'/' grupları, '*' grubundaki
  // disallow kurallarını o bot için geçersiz kılıyordu (Googlebot her şeyi
  // tarayabiliyordu) — bu yüzden kaldırıldı.
  //
  // Not: /auth, /profile, /analyses BİLEREK disallow'da DEĞİL. Bu sayfalar
  // metadata'da noindex; taranabilir olmaları noindex'in Google tarafından
  // okunup uygulanmasını sağlar (robots ile engellense URL-only indexlenebilirdi).
  // /og dinamik OG görsel endpoint'idir; sayfa olarak taranmasın diye engellendi.
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/og',
          '/payment/',
          '/admin/',
          '/private/',
          '/dashboard/',
          '/user/',
          '/tmp/',
        ],
      },
    ],
    sitemap: [absoluteUrl('/sitemap.xml')],
    host: SITE_URL,
  }
}
