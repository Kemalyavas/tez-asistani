// SEO Utility Functions

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tezai.com.tr'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

// Generate Open Graph image URL
export function generateOGImageUrl(title: string, description?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tezai.com.tr'
  const params = new URLSearchParams({
    title,
    ...(description && { description }),
  })
  return `${baseUrl}/api/og?${params.toString()}`
}

// SEO-friendly URL slug generator
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Meta description optimizer (ideal length: 150-160 chars)
export function optimizeMetaDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

// Title optimizer (ideal length: 50-60 chars)
export function optimizeTitle(title: string, siteName = 'TezAI', maxLength = 60): string {
  const fullTitle = `${title} | ${siteName}`
  
  if (fullTitle.length <= maxLength) return fullTitle
  
  const availableLength = maxLength - siteName.length - 3 // 3 for " | "
  
  if (title.length <= availableLength) return fullTitle
  
  const truncatedTitle = title.substring(0, availableLength - 3) + '...'
  return `${truncatedTitle} | ${siteName}`
}

// Extract keywords from text
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  const commonWords = [
    'bir', 'bu', 'da', 'de', 'en', 've', 'ile', 'için', 'olan', 'olarak',
    'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'ki', 'mi', 'mı',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ]
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
  
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

// Calculate reading time
export function calculateReadingTime(text: string): { minutes: number; seconds: number; words: number } {
  const wordsPerMinute = 200 // Average reading speed
  const words = text.split(/\s+/).filter(word => word.length > 0).length
  const totalMinutes = words / wordsPerMinute
  const minutes = Math.floor(totalMinutes)
  const seconds = Math.round((totalMinutes - minutes) * 60)
  
  return { minutes, seconds, words }
}

// Generate breadcrumb data
export function generateBreadcrumbData(pathname: string) {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs = [
    { name: 'Home', url: '/' }
  ]
  
  const routeMap: Record<string, string> = {
    'pricing': 'Pricing',
    'auth': 'Sign In',
    'profile': 'My Profile',
    'privacy-policy': 'Privacy Policy',
    'hakkimizda': 'About',
    'iletisim': 'Contact',
    'sss': 'FAQ',
    'blog': 'Blog',
    'ozellikler': 'Features',
    'akademik-formatlar': 'Academic Formats',
    'universitelere-ozel': 'For Universities'
  }
  
  let currentPath = ''
  
  paths.forEach(path => {
    currentPath += `/${path}`
    const name = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1)
    breadcrumbs.push({ name, url: currentPath })
  })
  
  return breadcrumbs
}

// SEO Score Calculator
export function calculateSEOScore(pageData: {
  title?: string
  description?: string
  keywords?: string[]
  headings?: { h1: number; h2: number; h3: number }
  images?: { total: number; withAlt: number }
  links?: { internal: number; external: number }
  wordCount?: number
}): { score: number; issues: string[]; suggestions: string[] } {
  let score = 0
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Title check (20 points)
  if (pageData.title) {
    if (pageData.title.length >= 50 && pageData.title.length <= 60) {
      score += 20
    } else if (pageData.title.length < 50) {
      score += 10
      issues.push('Başlık çok kısa (ideal: 50-60 karakter)')
      suggestions.push('Başlığınızı daha açıklayıcı hale getirin')
    } else {
      score += 5
      issues.push('Başlık çok uzun (ideal: 50-60 karakter)')
      suggestions.push('Başlığınızı kısaltın')
    }
  } else {
    issues.push('Başlık eksik')
  }
  
  // Description check (20 points)
  if (pageData.description) {
    if (pageData.description.length >= 150 && pageData.description.length <= 160) {
      score += 20
    } else if (pageData.description.length < 150) {
      score += 10
      issues.push('Meta açıklama çok kısa (ideal: 150-160 karakter)')
      suggestions.push('Meta açıklamanızı genişletin')
    } else {
      score += 5
      issues.push('Meta açıklama çok uzun (ideal: 150-160 karakter)')
      suggestions.push('Meta açıklamanızı kısaltın')
    }
  } else {
    issues.push('Meta açıklama eksik')
  }
  
  // Keywords check (15 points)
  if (pageData.keywords && pageData.keywords.length > 0) {
    if (pageData.keywords.length >= 5 && pageData.keywords.length <= 10) {
      score += 15
    } else if (pageData.keywords.length < 5) {
      score += 8
      suggestions.push('Daha fazla anahtar kelime ekleyin')
    } else {
      score += 8
      suggestions.push('Anahtar kelime sayısını azaltın')
    }
  } else {
    issues.push('Anahtar kelimeler eksik')
  }
  
  // Headings check (15 points)
  if (pageData.headings) {
    if (pageData.headings.h1 === 1) {
      score += 10
    } else if (pageData.headings.h1 === 0) {
      issues.push('H1 başlığı eksik')
    } else {
      issues.push('Birden fazla H1 başlığı var')
    }
    
    if (pageData.headings.h2 > 0) {
      score += 5
    } else {
      suggestions.push('H2 başlıkları ekleyin')
    }
  }
  
  // Images check (10 points)
  if (pageData.images) {
    if (pageData.images.total > 0) {
      const altPercentage = pageData.images.withAlt / pageData.images.total
      score += Math.round(altPercentage * 10)
      
      if (altPercentage < 1) {
        issues.push('Bazı görsellerde alt text eksik')
        suggestions.push('Tüm görsellere alt text ekleyin')
      }
    }
  }
  
  // Content length check (10 points)
  if (pageData.wordCount) {
    if (pageData.wordCount >= 300) {
      score += 10
    } else {
      score += Math.round((pageData.wordCount / 300) * 10)
      issues.push('İçerik çok kısa (minimum 300 kelime öneriliyor)')
      suggestions.push('İçeriğinizi genişletin')
    }
  }
  
  // Links check (10 points)
  if (pageData.links) {
    if (pageData.links.internal > 0) score += 5
    if (pageData.links.external > 0) score += 5
    
    if (pageData.links.internal === 0) {
      suggestions.push('İç bağlantılar ekleyin')
    }
  }
  
  return { score: Math.min(score, 100), issues, suggestions }
}

// Generate hreflang tags for international SEO
export function generateHreflangTags(currentPath: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tez-asistani.vercel.app'
  
  return [
    {
      hrefLang: 'tr',
      href: `${baseUrl}${currentPath}`
    },
    {
      hrefLang: 'tr-TR',
      href: `${baseUrl}${currentPath}`
    },
    {
      hrefLang: 'x-default',
      href: `${baseUrl}${currentPath}`
    }
  ]
}

// Social media sharing URLs
export function generateSocialSharingUrls(url: string, title: string, description?: string) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')
  
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  }
}
