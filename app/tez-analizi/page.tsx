import Link from 'next/link'
import { Check } from 'lucide-react'
import { tezAnaliziMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'
import { ANALYSIS_TIERS } from '../lib/pricing'

export const metadata = tezAnaliziMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Tez Analizi', url: absoluteUrl('/tez-analizi') },
])

const dimensions = [
  { title: 'Yapı ve Organizasyon', desc: 'Bölüm akışı, başlık hiyerarşisi ve bütünlük değerlendirilir.' },
  { title: 'Metodoloji', desc: 'Araştırma yöntemi, veri toplama ve analiz yaklaşımının tutarlılığı incelenir.' },
  { title: 'Literatür', desc: 'Kaynak yeterliliği ve literatürle kurulan bağ kontrol edilir.' },
  { title: 'Kaynak ve Atıf', desc: 'Atıfların formatı ve kaynakça tutarlılığı denetlenir.' },
  { title: 'Dil ve Yazım', desc: 'Akademik dil, anlatım netliği ve yazım kalitesi gözden geçirilir.' },
]

const steps = [
  { n: 1, title: 'Tezini Yükle', desc: 'PDF veya DOCX dosyanı güvenli sistemimize yükle.' },
  { n: 2, title: 'Yapay Zeka İncelesin', desc: 'TezAI metnini akademik standartlara göre çok boyutlu analiz eder.' },
  { n: 3, title: 'Raporunu Al', desc: 'Skorlar, eksikler ve önceliklendirilmiş düzeltme önerileriyle raporunu indir.' },
]

function rangeLabel(min: number, max: number) {
  return max >= 999 ? `${min}+ sayfa` : `${min}–${max} sayfa`
}

export default function TezAnaliziPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Yapay Zeka ile Tez Analizi</h1>
          <p className="text-lg text-gray-700 mb-8">
            Tezini jüri savunmasından önce yapay zeka ile analiz et. TezAI; yapı, metodoloji,
            literatür, kaynak ve dil boyutlarında eksikleri tespit eder ve nasıl düzelteceğini somut
            önerilerle gösterir. Saatler süren manuel kontrol yerine saniyeler içinde rapor al.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/#app" className="btn-primary">Tezini Ücretsiz Analiz Et</Link>
            <Link href="/akademik-formatlar" className="btn-secondary">Kaynak Formatları</Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Tezinde neler analiz edilir?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {dimensions.map((d) => (
              <div key={d.title} className="flex items-start gap-3">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-800">{d.title}</h3>
                  <p className="text-gray-600">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Üç adımda nasıl çalışır?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold mb-4">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">Analiz seviyeleri</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Tezinin sayfa sayısına göre uygun analiz seviyesi otomatik belirlenir. Kapsam arttıkça
            değerlendirme derinleşir.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {ANALYSIS_TIERS.map((tier) => (
              <div key={tier.id} className="card flex flex-col">
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{rangeLabel(tier.minPages, tier.maxPages)}</p>
                <p className="text-primary-600 font-semibold mb-4">{tier.credits} kredi</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-10">
            Kredi paketlerinin tamamını{' '}
            <Link href="/pricing" className="text-primary-600 font-semibold hover:underline">
              fiyatlar sayfasında
            </Link>{' '}
            görebilirsin.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Jüri öncesi son kontrolünü yap</h2>
          <p className="text-primary-100 mb-8">Kayıt olana 10 ücretsiz kredi. Kredi kartı gerekmez.</p>
          <Link href="/#app" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
            Ücretsiz Analiz Başlat
          </Link>
        </div>
      </section>
    </div>
  )
}
