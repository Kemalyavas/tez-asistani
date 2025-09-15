import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.tezai.com.tr'
  const currentDate = new Date()

  // Ana sayfalar
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    // Add more public pages here as they are created
  ]

  // Blog posts: add when published
  const blogPosts: MetadataRoute.Sitemap = []

  // Özellik sayfaları
  const featurePages: MetadataRoute.Sitemap = []

  // Üniversite odaklı sayfalar
  const universityPages: MetadataRoute.Sitemap = []

  return [
    ...staticPages,
    ...blogPosts,
    ...featurePages,
    ...universityPages
  ]
}
