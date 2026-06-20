import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import CitationFormatter from '../components/CitationFormatter';
import { buildPageMetadata } from '../lib/metadata';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Ücretsiz APA Kaynakça Oluşturucu (APA 7, MLA, Chicago, IEEE)',
  description:
    'Ücretsiz APA kaynakça oluşturucu: kitap, makale ve web sitesi için APA 7, MLA 9, Chicago ve IEEE formatında anında atıf oluştur. Üyelik gerekmeden hemen dene.',
  path: '/apa-kaynakca-olusturucu',
  keywords:
    'apa kaynakça oluşturucu, apa 7 kaynakça oluşturucu, ücretsiz kaynakça oluşturucu, atıf oluşturucu, mla kaynakça oluşturucu, chicago kaynakça, ieee kaynakça, kaynak gösterme aracı',
  ogTitle: 'Ücretsiz APA Kaynakça Oluşturucu',
  ogSubtitle: 'APA 7 • MLA • Chicago • IEEE',
});

const FAQ = [
  {
    q: 'APA kaynakça oluşturucu ücretsiz mi?',
    a: 'Evet. Aracı üyelik olmadan günde birkaç kez ücretsiz deneyebilirsin. Daha fazlası için ücretsiz hesap oluşturduğunda 10 kredi hediye edilir; kredi kartı gerekmez.',
  },
  {
    q: 'Hangi atıf formatlarını destekliyor?',
    a: 'APA 7, MLA 9, Chicago ve IEEE formatlarını destekler. Kaynak türü olarak kitap, dergi makalesi ve web sitesi seçebilirsin.',
  },
  {
    q: 'Oluşturulan kaynakça doğru mu?',
    a: 'Araç, girdiğin bilgileri seçtiğin formatın kurallarına göre yapay zeka ile biçimlendirir. Sonucu her zaman kontrol etmeni öneririz; eksik bilgi girersen çıktı da eksik olabilir.',
  },
  {
    q: 'Tek tek değil, tüm tezimi kontrol edebilir miyim?',
    a: 'Evet. Tez Analizi özelliğiyle PDF veya DOCX dosyanı yükleyip yapı, metodoloji, kaynak tutarlılığı ve formatı bütün olarak analiz ettirebilirsin.',
  },
];

const STEPS = [
  { icon: BookOpen, t: 'Kaynak türünü seç', d: 'Kitap, makale veya web sitesi.' },
  { icon: Zap, t: 'Formatı seç', d: 'APA 7, MLA 9, Chicago veya IEEE.' },
  { icon: ShieldCheck, t: 'Bilgileri gir', d: 'Yazar, başlık, yıl; sonuç anında hazır.' },
];

export default function ApaKaynakcaOlusturucuPage() {
  const url = `${SITE_URL}/apa-kaynakca-olusturucu`;
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TezAI Kaynakça Oluşturucu',
    url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'tr-TR',
    description:
      'APA 7, MLA 9, Chicago ve IEEE formatlarında ücretsiz online kaynakça ve atıf oluşturma aracı.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
    provider: { '@type': 'Organization', name: 'TezAI', url: SITE_URL },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'APA Kaynakça Oluşturucu', item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[150px] left-1/2 -translate-x-1/2 h-[440px] w-[720px] rounded-full opacity-65 blur-[14px]"
          style={{
            background:
              'radial-gradient(ellipse at center, #dde4f4, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-[68px] pb-[52px] text-center">
          <div className="mb-5 inline-flex items-center gap-[9px]">
            <span className="h-px w-[30px] bg-primary-600" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
              Ücretsiz araç
            </span>
            <span className="h-px w-[30px] bg-primary-600" />
          </div>
          <h1 className="mb-[18px] font-serif text-[2.6rem] sm:text-5xl font-medium leading-[1.08] tracking-[-0.02em] text-ink">
            Ücretsiz APA kaynakça oluşturucu
          </h1>
          <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-ink/60">
            Kitap, makale veya web sitesi bilgilerini gir;{' '}
            <strong className="font-semibold text-ink">APA 7, MLA 9, Chicago</strong> ve{' '}
            <strong className="font-semibold text-ink">IEEE</strong> formatında saniyeler içinde doğru
            kaynakça oluştur. Üyelik gerekmez.
          </p>
        </div>
      </section>

      {/* Araç — gerçek CitationFormatter aracı editöryel kart içinde */}
      <section className="mx-auto max-w-3xl px-6 pt-9">
        <div className="rounded-[5px] border border-line bg-white p-6 shadow-[0_26px_60px_-40px_rgba(28,26,23,0.42)] sm:p-8">
          <CitationFormatter />
        </div>
      </section>

      {/* Nasıl kullanılır */}
      <section className="reveal mx-auto max-w-3xl px-6 py-14">
        <h2 className="mb-7 text-center font-serif text-3xl font-medium tracking-[-0.015em] text-ink">
          Nasıl kullanılır?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-[5px] border border-line bg-white p-6 text-center">
              <div className="mx-auto mb-3.5 inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-base font-bold text-ink">{s.t}</h3>
              <p className="text-sm leading-relaxed text-ink/55">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bilgi içeriği */}
      <section className="reveal border-y border-line bg-primary-50">
        <div className="mx-auto max-w-[740px] px-6 py-14">
          <h2 className="mb-4 font-serif text-[1.75rem] font-semibold tracking-[-0.015em] text-ink">
            APA kaynakça nedir?
          </h2>
          <p className="mb-4 text-base leading-[1.7] text-ink/70">
            APA kaynakça, Amerikan Psikoloji Derneği&apos;nin (APA) yazar-tarih sistemine göre
            düzenlenen kaynak listesidir. Özellikle sosyal bilimler, eğitim ve sağlık alanlarında
            yaygındır. Her kaynak; yazar soyadı, yıl, eser başlığı ve yayın bilgisi sırasıyla,
            alfabetik ve asılı girintili biçimde listelenir. Bu araç, girdiğin bilgileri seçtiğin
            formatın kurallarına göre otomatik biçimlendirir.
          </p>
          <p className="text-base leading-[1.7] text-ink/70">
            Atıf kurallarının ayrıntılı anlatımı, örnek atıflar ve sık yapılan hatalar için{' '}
            <Link
              href="/blog/apa-7-kaynakca-nasil-yapilir"
              className="font-bold text-primary-700 underline-offset-2 hover:underline"
            >
              APA 7 kaynakça nasıl yapılır rehberimize
            </Link>{' '}
            göz atabilir; farklı stillerin karşılaştırması için{' '}
            <Link
              href="/blog/atif-formatlari-apa-mla-chicago-ieee"
              className="font-bold text-primary-700 underline-offset-2 hover:underline"
            >
              atıf formatları karşılaştırmasını
            </Link>{' '}
            inceleyebilirsin.
          </p>
        </div>
      </section>

      {/* FAQ — statik açık kartlar (server component + metadata korunur) */}
      <section className="reveal mx-auto max-w-[740px] px-6 py-14">
        <h2 className="mb-7 text-center font-serif text-3xl font-medium tracking-[-0.015em] text-ink">
          Sık sorulan sorular
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-[5px] border border-line bg-white p-[22px]">
              <h3 className="mb-2 text-base font-bold text-ink">{f.q}</h3>
              <p className="text-[0.95rem] leading-[1.62] text-ink/60">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="reveal px-6 pb-[72px]">
        <div className="relative mx-auto max-w-[740px] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(20,34,79,0.7)] bg-gradient-to-br from-[#16265c] via-[#1e3a8a] to-[#2f54a6] px-10 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-12 h-[300px] w-[300px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(150,178,236,0.16), transparent 70%)',
            }}
          />
          <div className="relative">
            <h2 className="mb-3 font-serif text-[2rem] font-medium tracking-[-0.015em] text-white">
              Sadece kaynakça değil, tüm tezini kontrol et
            </h2>
            <p className="mx-auto mb-7 max-w-xl text-[1.05rem] text-primary-100">
              TezAI; yapı, metodoloji, kaynak tutarlılığı ve formatı yapay zeka ile analiz eder.
              Kayıt olana 10 ücretsiz kredi.
            </p>
            <Link
              href="/tez-analizi"
              className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 font-bold text-primary-700 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] transition hover:-translate-y-px"
            >
              Tez Analizini Dene <ArrowRight className="h-[17px] w-[17px]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
