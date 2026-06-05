import { MetadataRoute } from 'next'
import { absoluteUrl } from './lib/site'
import { getAllPosts } from './lib/blog'

// İçerik değiştiğinde güncelle. Her build'de "now" üretmek yerine sabit tarih
// kullanmak Google için daha güvenilir bir lastmod sinyali verir.
const LAST_MODIFIED = new Date('2026-05-22')

type Entry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

const pages: Entry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/tez-analizi', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/akademik-formatlar', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/ozellikler', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/sss', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/hakkimizda', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/iletisim', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/delivery-returns', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/mesafeli-satis-sozlesmesi', changeFrequency: 'yearly', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = pages.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  }))
  const blogEntries = getAllPosts().map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  return [...staticEntries, ...blogEntries]
}
