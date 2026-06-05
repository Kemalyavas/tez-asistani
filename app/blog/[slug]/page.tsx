import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/app/lib/blog';
import { generateArticleMetadata } from '@/app/lib/metadata';
import { SITE_URL } from '@/app/lib/site';

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return generateArticleMetadata({
    title: post.title,
    description: post.description,
    slug: post.slug,
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
    tags: post.keywords.split(',').map((k) => k.trim()).filter(Boolean),
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const related = getRelatedPosts(post.slug);
  const url = `${SITE_URL}/blog/${post.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    inLanguage: 'tr-TR',
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: { '@type': 'Organization', name: 'TezAI', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'TezAI',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  const faqSchema =
    post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <header className="gradient-bg border-b border-slate-100">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Tüm Yazılar
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">{post.title}</h1>
          <p className="text-lg text-slate-600 mb-4">{post.heroSubtitle}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />{' '}
              {new Date(post.datePublished).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {post.readingMinutes} dk okuma
            </span>
          </div>
        </div>
      </header>

      <article className="container mx-auto px-4 py-10 max-w-3xl">
        {/* GEO: alıntılanabilir net cevap bloğu */}
        <p className="text-lg leading-relaxed text-slate-800 bg-primary-50 border-l-4 border-primary-500 rounded-r-lg px-5 py-4 mb-8">
          {post.answerBlock}
        </p>

        {/* Gövde */}
        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-table:text-sm"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* FAQ */}
        {post.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">Sık Sorulan Sorular</h2>
            <div className="space-y-3">
              {post.faq.map((f, i) => (
                <details key={i} className="group bg-slate-50 rounded-xl px-5 py-4">
                  <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-primary-500 group-open:rotate-45 transition-transform text-xl leading-none flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Tezini yapay zeka ile kontrol et</h2>
          <p className="text-primary-100 mb-6 max-w-xl mx-auto">
            TezAI; yapı, metodoloji, kaynak tutarlılığı ve formatı saniyeler içinde analiz eder. Kayıt olana 10 ücretsiz kredi.
          </p>
          <Link
            href="/tez-analizi"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Ücretsiz Dene <ArrowRight className="h-5 w-5" />
          </Link>
        </section>

        {/* İlgili yazılar */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-5">İlgili Yazılar</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block bg-white ring-1 ring-slate-200 rounded-xl p-5 hover:ring-primary-300 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-slate-900 mb-1">{r.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
