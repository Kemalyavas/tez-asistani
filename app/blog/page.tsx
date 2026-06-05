import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { getAllPosts } from '@/app/lib/blog';
import { buildPageMetadata } from '@/app/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog — Tez Yazım ve Akademik Kaynak Rehberleri',
  description:
    'Tez yazımı, APA/MLA/Chicago/IEEE kaynakça, YÖK tez formatı, özet (abstract) yazma ve akademik yazım hakkında uzman rehberler. TezAI blogu.',
  path: '/blog',
  keywords:
    'tez yazım rehberi, akademik yazım, apa kaynakça, yök tez formatı, tez özeti, atıf formatları',
  ogTitle: 'TezAI Blog',
  ogSubtitle: 'Tez Yazım ve Akademik Kaynak Rehberleri',
});

export default function BlogHubPage() {
  const posts = getAllPosts();
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Blog</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tez yazımı, akademik kaynakça ve format konularında uzman, güncel rehberler.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-slate-400">Yazılar çok yakında.</p>
        ) : (
          <div className="space-y-5">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white rounded-2xl ring-1 ring-slate-100 p-6 sm:p-8 hover:shadow-xl hover:-translate-y-0.5 hover:ring-primary-200 transition-all"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{p.title}</h2>
                <p className="text-slate-600 mb-4">{p.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-slate-400">
                    <Clock className="h-4 w-4" /> {p.readingMinutes} dk okuma
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary-600 font-medium text-sm">
                    Oku <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
