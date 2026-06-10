// Tek SEO/site yapılandırma kaynağı.
// Tüm domain referansları (metadata, sitemap, robots, structured data, OG) buradan gelir.
// Domain değişirse SADECE burayı veya NEXT_PUBLIC_SITE_URL env değişkenini güncelle.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tezai.com.tr'
).replace(/\/$/, '');

export const SITE_NAME = 'TezAI';
export const SITE_LOCALE = 'tr_TR';
export const SITE_LANG = 'tr-TR';
export const TWITTER_HANDLE = '@tezasistani';
export const CONTACT_EMAIL = 'destek.tezai@gmail.com';

// Tam URL üretici (canonical, OG, sitemap için)
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Dinamik OG görseli URL'i (app/og/route.tsx)
export function ogImageUrl(title?: string, subtitle?: string): string {
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (subtitle) params.set('subtitle', subtitle);
  const qs = params.toString();
  return `${SITE_URL}/og${qs ? `?${qs}` : ''}`;
}
