// Blog veri katmanı — makaleler build-time statik (CMS yok, YAGNI).
// İçerik app/content/blog/<slug>.ts dosyalarından gelir; burada toplanır.

export interface BlogFAQ {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string; // H1 + SEO başlık
  description: string; // meta description
  keywords: string;
  excerpt: string; // hub kartı özeti
  heroSubtitle: string;
  readingMinutes: number;
  datePublished: string; // ISO (YYYY-MM-DD)
  dateModified: string;
  answerBlock: string; // GEO: ilk alıntılanabilir cevap paragrafı (düz metin)
  contentHtml: string; // gövde (semantic HTML, prose ile render)
  faq: BlogFAQ[];
  related: string[]; // ilişkili makale slug'ları
}

import { apa7Kaynakca } from '../content/blog/apa-7-kaynakca-nasil-yapilir';
import { yokTezFormat } from '../content/blog/yok-tez-yazim-kurallari';
import { tezOzeti } from '../content/blog/tez-ozeti-abstract-nasil-yazilir';
import { tezYazimAsamalari } from '../content/blog/tez-yazim-asamalari';
import { atifFormatlari } from '../content/blog/atif-formatlari-apa-mla-chicago-ieee';

// Yayın sırası (hub önce, sonra yüksek hacimli rehberler)
export const BLOG_POSTS: BlogPost[] = [
  tezYazimAsamalari,
  apa7Kaynakca,
  yokTezFormat,
  tezOzeti,
  atifFormatlari,
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  const related = post.related
    .map((s) => getPostBySlug(s))
    .filter((p): p is BlogPost => Boolean(p));
  // related yetersizse diğer makalelerle tamamla
  if (related.length < limit) {
    for (const p of BLOG_POSTS) {
      if (related.length >= limit) break;
      if (p.slug !== slug && !related.some((r) => r.slug === p.slug)) related.push(p);
    }
  }
  return related.slice(0, limit);
}
