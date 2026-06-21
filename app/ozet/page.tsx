import type { Metadata } from 'next';
import Link from 'next/link';
import AbstractGenerator from '../components/AbstractGenerator';
import CtaBand from '../components/CtaBand';
import { buildPageMetadata } from '../lib/metadata';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Tez Özeti / Abstract Oluşturucu (Türkçe & İngilizce)',
  description:
    'Tez özeti (abstract) oluşturucu: tez içeriğinden Türkçe ve İngilizce akademik özet üret. Kelime sınırına uygun, düzenlemeye hazır. Üyelik gerekmeden hemen dene.',
  path: '/ozet',
  keywords:
    'tez özeti oluşturucu, abstract oluşturucu, özet yazma aracı, türkçe abstract, ingilizce abstract, akademik özet, tez abstract örneği',
  ogTitle: 'Tez Özeti / Abstract Oluşturucu',
  ogSubtitle: 'Türkçe & İngilizce akademik özet',
});

const FAQ = [
  {
    q: 'Özet oluşturucu ücretsiz mi?',
    a: 'Aracı üyelik olmadan günde sınırlı sayıda ücretsiz deneyebilirsin. Daha fazlası için ücretsiz hesap oluşturduğunda 10 kredi hediye edilir; her özet 3 kredi harcar.',
  },
  {
    q: 'Hangi dillerde özet üretebiliyorum?',
    a: 'Türkçe (Özet), İngilizce (Abstract) veya her ikisini birden üretebilirsin. Kısa, standart veya detaylı uzunluk seçenekleri vardır.',
  },
  {
    q: 'Üretilen özet doğru mu?',
    a: 'Araç, verdiğin içeriği akademik özet kurallarına göre biçimlendirir. Sonucu her zaman kontrol etmeni öneririz; eksik içerik girersen özet de eksik olabilir.',
  },
  {
    q: 'Tüm tezimi analiz ettirebilir miyim?',
    a: 'Evet. Tez Analizi özelliğiyle PDF veya DOCX dosyanı yükleyip yapı, yöntem, kaynak tutarlılığı ve formatı bütün olarak değerlendirebilirsin.',
  },
];

export default function OzetOlusturucuPage() {
  const url = `${SITE_URL}/ozet`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Özet Oluşturucu', item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[720px] h-[440px] rounded-full bg-primary-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-6 py-[68px] text-center">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-primary-700">Ücretsiz araç</span>
          </div>
          <h1 className="font-serif font-medium text-[2.6rem] sm:text-5xl leading-[1.08] tracking-[-0.02em] mb-4">
            Tez özeti / <span className="italic text-primary-700">abstract</span> oluşturucu
          </h1>
          <p className="text-lg leading-relaxed text-ink/60 max-w-2xl mx-auto">
            Tez içeriğini gir; <strong className="text-ink">Türkçe ve İngilizce</strong> akademik özet saniyeler içinde,
            kelime sınırına uygun ve düzenlemeye hazır olarak oluşsun. Üyelik gerekmez.
          </p>
        </div>
      </section>

      {/* Araç */}
      <section className="max-w-3xl mx-auto px-6 -mt-2">
        <div className="bg-white border border-line rounded-[5px] shadow-[0_26px_60px_-40px_rgba(28,26,23,0.42)] p-6 sm:p-8">
          <AbstractGenerator />
        </div>
        <div className="flex items-center gap-2 mt-4 text-[13px] text-ink/40">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Üyelik gerekmeden günde birkaç kez ücretsiz dene.
        </div>
      </section>

      {/* Bilgi */}
      <section className="max-w-2xl mx-auto px-6 py-14">
        <h2 className="font-serif text-2xl font-semibold mb-4">İyi bir tez özeti nasıl olur?</h2>
        <p className="text-base leading-relaxed text-ink/70 mb-4">
          Akademik özet (abstract); çalışmanın amacını, yöntemini, başlıca bulgularını ve sonucunu kısaca,
          tek paragrafta özetler. Genellikle 150–300 kelime arası tutulur ve tezin tamamını okumadan
          çalışmanın katkısını anlatır. Ayrıntılı yapı ve örnekler için{' '}
          <Link href="/blog/tez-ozeti-abstract-nasil-yazilir" className="text-primary-700 font-semibold hover:underline">
            tez özeti nasıl yazılır rehberimize
          </Link>{' '}
          göz atabilirsin.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-14">
        <h2 className="font-serif text-2xl font-semibold mb-5 text-center">Sık sorulan sorular</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white border border-line rounded-[7px] p-5">
              <h3 className="text-base font-bold text-ink mb-1.5">{f.q}</h3>
              <p className="text-[14.5px] leading-relaxed text-ink/60">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <CtaBand
        title="Sadece özet değil, tüm tezini kontrol et"
        subtitle="TezAI; yapı, yöntem, kaynak tutarlılığı ve formatı analiz eder. Kayıt olana 10 ücretsiz kredi."
        ctaLabel="Tez Analizini Dene"
        ctaHref="/upload"
        maxWidth="max-w-3xl"
      />
    </div>
  );
}
