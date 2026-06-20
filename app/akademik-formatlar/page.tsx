import Link from 'next/link'
import { akademikFormatlarMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = akademikFormatlarMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Akademik Formatlar', url: absoluteUrl('/akademik-formatlar') },
])

const formats = [
  {
    name: 'APA 7',
    full: 'American Psychological Association, 7. Baskı',
    fields: 'Sosyal bilimler, psikoloji, eğitim, sağlık bilimleri',
    detail:
      'Yazar-tarih sistemini kullanır; metin içinde (Yazar, Yıl) biçiminde atıf yapılır. Türkiye’de en yaygın kullanılan akademik formatlardan biridir.',
  },
  {
    name: 'MLA 9',
    full: 'Modern Language Association, 9. Baskı',
    fields: 'Edebiyat, dil bilimi, beşeri bilimler',
    detail:
      'Yazar-sayfa sistemini kullanır; kaynaklar “Works Cited” (Kaynakça) başlığı altında listelenir. Metinsel analiz ağırlıklı çalışmalarda tercih edilir.',
  },
  {
    name: 'Chicago 17',
    full: 'Chicago Manual of Style, 17. Baskı',
    fields: 'Tarih, sanat, beşeri bilimler, yayıncılık',
    detail:
      'Hem dipnot-bibliyografya hem de yazar-tarih olmak üzere iki sistem sunar. Kapsamlı kaynak gösterimi gerektiren çalışmalarda kullanılır.',
  },
  {
    name: 'IEEE',
    full: 'Institute of Electrical and Electronics Engineers',
    fields: 'Mühendislik, bilgisayar bilimleri, teknoloji',
    detail:
      'Numaralandırılmış atıf sistemini kullanır; kaynaklar metinde [1], [2] biçiminde köşeli parantezle gösterilir. Teknik ve mühendislik tezlerinde standarttır.',
  },
]

export default function AkademikFormatlarPage() {
  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* ===== HERO ===== */}
      <section className="reveal relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute left-1/2 top-[-150px] z-0 h-[480px] w-[760px] -translate-x-1/2 rounded-full opacity-70 blur-[14px]"
          style={{
            background:
              'radial-gradient(ellipse at center, #dde4f4, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[880px] px-6 pb-16 pt-[74px] text-center sm:px-9">
          <div className="mb-[22px] inline-flex items-center gap-[9px]">
            <span className="h-px w-8 bg-primary-600" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
              Kaynak rehberi
            </span>
            <span className="h-px w-8 bg-primary-600" />
          </div>
          <h1 className="mb-5 font-serif text-4xl font-medium leading-[1.08] tracking-[-0.02em] text-ink sm:text-5xl md:text-[52px]">
            Akademik atıf formatları:{' '}
            <span className="italic text-primary-700">APA, MLA, Chicago, IEEE</span>
          </h1>
          <p className="mx-auto mb-[30px] max-w-[620px] text-lg leading-relaxed text-ink/60">
            Doğru kaynak gösterimi, akademik bir çalışmanın güvenilirliğinin temelidir. Hangi
            formatın hangi alanda kullanıldığını aşağıda bulabilir, kaynakçanı TezAI ile saniyeler
            içinde oluşturabilirsin.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-[9px] rounded-md bg-primary-600 px-7 py-[15px] text-base font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,58,138,0.9)] transition hover:bg-primary-700"
          >
            Kaynakçanı ücretsiz oluştur
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ===== FORMAT CARDS ===== */}
      <section className="reveal mx-auto max-w-[1080px] px-6 py-[72px] sm:px-9">
        <div className="grid gap-[22px] md:grid-cols-2">
          {formats.map((f) => (
            <div
              key={f.name}
              className="rounded-[5px] border border-line bg-white p-[30px] shadow-[0_18px_40px_-34px_rgba(28,26,23,0.4)] transition hover:-translate-y-1 hover:shadow-[0_28px_56px_-38px_rgba(28,26,23,0.45)]"
            >
              <div className="mb-1 flex items-baseline gap-3">
                <h2 className="font-serif text-3xl font-semibold tracking-[-0.01em] text-primary-700">
                  {f.name}
                </h2>
                <span className="h-[7px] w-[7px] rounded-full bg-primary-100" />
              </div>
              <p className="mb-[18px] text-[13px] font-semibold text-ink/40">{f.full}</p>
              <p className="mb-[18px] text-[15px] leading-relaxed text-ink/70">{f.detail}</p>
              <div className="border-t border-line pt-4">
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink/40">
                  Kullanım alanları
                </span>
                <p className="mt-[5px] text-sm text-ink/60">{f.fields}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW ===== */}
      <section className="reveal border-y border-line bg-primary-50">
        <div className="mx-auto max-w-[780px] px-6 py-[72px] text-center sm:px-9">
          <h2 className="mb-5 font-serif text-3xl font-medium leading-[1.1] tracking-[-0.015em] text-ink md:text-4xl">
            TezAI ile kaynakça nasıl oluşturulur?
          </h2>
          <p className="mb-4 text-[17px] leading-relaxed text-ink/70">
            Kaynak bilgisini gir veya tezini yükle, istediğin formatı seç. TezAI atıfı ve kaynakça
            girişini saniyeler içinde, biçim kurallarına uygun olarak üretir. Tek bir kaynak
            biçimlendirmek yalnızca 1 kredi harcar.
          </p>
          <p className="text-[15.5px] text-ink/55">
            Tezinin tamamını kaynak tutarlılığı açısından kontrol ettirmek mi istiyorsun?{' '}
            <Link
              href="/tez-analizi"
              className="font-bold text-primary-700 hover:underline"
            >
              Tez analizi sayfasına göz at →
            </Link>
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="reveal mt-[72px] px-6 pb-[72px] sm:px-9">
        <div className="relative mx-auto max-w-[1080px] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(20,34,79,0.7)] bg-gradient-to-br from-[#16265c] via-[#1e3a8a] to-[#2f54a6] px-10 py-16 text-center">
          <div
            className="pointer-events-none absolute right-[-50px] top-[-80px] h-[300px] w-[300px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(150,178,236,0.18), transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="mb-3 font-serif text-3xl font-medium tracking-[-0.015em] text-white md:text-[38px]">
              Doğru kaynakça, tek tıkla
            </h2>
            <p className="mb-7 text-lg text-[#c2cbe6]">Kayıt olana 10 ücretsiz kredi.</p>
            <Link
              href="/auth"
              className="inline-block rounded-md bg-white px-8 py-[15px] text-base font-bold text-primary-700 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] transition hover:bg-paper"
            >
              Hemen Dene
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
