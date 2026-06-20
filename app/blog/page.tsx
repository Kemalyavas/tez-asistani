import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock } from 'lucide-react';
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
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-paper">
      {/* HERO */}
      <section className="reveal relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[150px] left-1/2 -translate-x-1/2 w-[720px] h-[440px] rounded-full opacity-65 blur-[14px] bg-[radial-gradient(ellipse_at_center,#dde4f4,transparent_70%)] z-0"
        />
        <div className="relative z-10 mx-auto max-w-[780px] px-6 pt-20 pb-11 text-center">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="w-8 h-px bg-primary-600" />
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700">
              Rehberler
            </span>
            <span className="w-8 h-px bg-primary-600" />
          </div>
          <h1 className="font-serif font-medium text-5xl leading-[1.06] tracking-[-0.02em] text-ink mb-4">
            Blog
          </h1>
          <p className="mx-auto max-w-[560px] text-lg leading-relaxed text-ink/60">
            Tez yazımı, akademik kaynakça ve format konularında uzman, güncel rehberler.
          </p>
        </div>
      </section>

      {/* POSTS */}
      <section className="reveal mx-auto max-w-[820px] px-6 pt-6 pb-20">
        {posts.length === 0 ? (
          <p className="text-center text-ink/40">Yazılar çok yakında.</p>
        ) : (
          <>
            {/* featured */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block bg-white border border-line rounded-[5px] shadow-[0_22px_50px_-38px_rgba(28,26,23,0.42)] p-9 sm:px-10 mb-5 transition-all hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-38px_rgba(28,26,23,0.46)]"
              >
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary-700 bg-primary-50 px-2.5 py-[5px] rounded-full">
                    Öne çıkan
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/40">
                    <Clock className="h-3.5 w-3.5" /> {featured.readingMinutes} dk okuma
                  </span>
                </div>
                <h2 className="font-serif font-semibold text-3xl leading-[1.16] tracking-[-0.01em] text-ink mb-3">
                  {featured.title}
                </h2>
                <p className="text-base leading-relaxed text-ink/60 mb-[18px]">
                  {featured.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700">
                  Oku <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}

            {/* rest */}
            {rest.length > 0 && (
              <div className="flex flex-col gap-3.5">
                {rest.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group flex items-center gap-[22px] bg-white border border-line rounded-[5px] shadow-[0_16px_38px_-34px_rgba(28,26,23,0.4)] px-7 py-6 transition-all hover:-translate-y-[2px] hover:shadow-[0_24px_48px_-36px_rgba(28,26,23,0.45)] hover:border-[#d8d2c2]"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-xl leading-[1.25] tracking-[-0.01em] text-ink mb-[7px]">
                        {p.title}
                      </h3>
                      <p className="text-[14.5px] leading-[1.55] text-ink/60 mb-2.5">
                        {p.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/40">
                        <Clock className="h-[13px] w-[13px]" /> {p.readingMinutes} dk okuma
                      </span>
                    </div>
                    <span className="flex-none w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 transition-transform group-hover:translate-x-0.5">
                      <ChevronRight className="h-[18px] w-[18px]" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      <section className="reveal px-6 pb-[72px]">
        <div className="relative mx-auto max-w-[820px] overflow-hidden rounded-md bg-gradient-to-br from-[#14224f] to-[#2a52a8] px-10 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[90px] -left-10 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(150,178,236,0.16),transparent_70%)]"
          />
          <div className="relative">
            <h2 className="font-serif font-medium text-[34px] tracking-[-0.015em] text-white mb-3">
              Okudun, şimdi uygula
            </h2>
            <p className="text-[17px] text-[#c2cbe6] mb-[26px]">
              Tezini analiz et, 10 ücretsiz krediyle başla.
            </p>
            <Link
              href="/auth"
              className="inline-block rounded-md bg-white px-[30px] py-3.5 text-base font-bold text-[#15296b] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
