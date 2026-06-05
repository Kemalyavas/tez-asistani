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
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <header className="gradient-bg border-b border-slate-100">
        <div className="container mx-auto px-4 py-14 max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ücretsiz APA Kaynakça Oluşturucu
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Kitap, makale veya web sitesi bilgilerini gir; <strong>APA 7, MLA 9, Chicago</strong> ve{' '}
            <strong>IEEE</strong> formatında saniyeler içinde doğru kaynakça oluştur. Üyelik gerekmez.
          </p>
        </div>
      </header>

      {/* Araç */}
      <section className="container mx-auto px-4 -mt-6 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-8">
          <CitationFormatter />
        </div>
      </section>

      {/* Nasıl kullanılır */}
      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Nasıl kullanılır?</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: BookOpen, t: 'Kaynak türünü seç', d: 'Kitap, makale veya web sitesi.' },
            { icon: Zap, t: 'Formatı seç', d: 'APA 7, MLA 9, Chicago veya IEEE.' },
            { icon: ShieldCheck, t: 'Bilgileri gir', d: 'Yazar, başlık, yıl; sonuç anında hazır.' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-5 text-center">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-100 text-primary-600 mb-3">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{s.t}</h3>
              <p className="text-sm text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bilgi içeriği */}
      <section className="container mx-auto px-4 pb-6 max-w-3xl">
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline">
          <h2>APA kaynakça nedir?</h2>
          <p>
            APA kaynakça, Amerikan Psikoloji Derneği&apos;nin (APA) yazar-tarih sistemine göre düzenlenen
            kaynak listesidir. Özellikle sosyal bilimler, eğitim ve sağlık alanlarında yaygındır.
            Her kaynak; yazar soyadı, yıl, eser başlığı ve yayın bilgisi sırasıyla, alfabetik ve asılı
            girintili biçimde listelenir. Bu araç, girdiğin bilgileri seçtiğin formatın kurallarına göre
            otomatik biçimlendirir.
          </p>
          <p>
            Atıf kurallarının ayrıntılı anlatımı, örnek atıflar ve sık yapılan hatalar için{' '}
            <Link href="/blog/apa-7-kaynakca-nasil-yapilir">APA 7 kaynakça nasıl yapılır rehberimize</Link>{' '}
            göz atabilir; farklı stillerin karşılaştırması için{' '}
            <Link href="/blog/atif-formatlari-apa-mla-chicago-ieee">atıf formatları karşılaştırmasını</Link>{' '}
            inceleyebilirsin.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-10 max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-5">Sık Sorulan Sorular</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
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

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16 max-w-3xl">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Sadece kaynakça değil, tüm tezini kontrol et</h2>
          <p className="text-primary-100 mb-6 max-w-xl mx-auto">
            TezAI; yapı, metodoloji, kaynak tutarlılığı ve formatı yapay zeka ile analiz eder. Kayıt olana 10 ücretsiz kredi.
          </p>
          <Link
            href="/tez-analizi"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Tez Analizini Dene <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
