import Link from 'next/link'
import { GraduationCap, BookMarked, Layers } from 'lucide-react'
import { universitelereOzelMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = universitelereOzelMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Üniversitelere Özel', url: absoluteUrl('/universitelere-ozel') },
])

const levels = [
  {
    icon: GraduationCap,
    title: 'Lisans Bitirme Tezi',
    desc: 'Bölüm yazım kılavuzuna uygun yapı, kaynak gösterimi ve dil kontrolü. İlk akademik çalışman için sağlam bir başlangıç.',
  },
  {
    icon: BookMarked,
    title: 'Yüksek Lisans Tezi',
    desc: 'Metodoloji ve literatür tutarlılığına odaklanan derinlemesine analiz; jüri beklentilerine göre eksiklerin tespiti.',
  },
  {
    icon: Layers,
    title: 'Doktora Tezi',
    desc: 'Özgün katkı, argümantasyon bütünlüğü ve kapsamlı kaynak denetimiyle yayın hazırlığı düzeyinde değerlendirme.',
  },
]

export default function UniversitelereOzelPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Üniversitelere ve Bölümlere Özel Tez Desteği
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Her üniversitenin ve bölümün kendi tez yazım kılavuzu, biçim kuralları ve atıf tercihi
            vardır. TezAI; APA, MLA, Chicago ve IEEE gibi farklı formatları destekleyerek tezini
            kurumunun beklediği standarda yaklaştırır. Lisanstan doktoraya, her düzeyde yanındadır.
          </p>
          <Link href="/#app" className="btn-primary">Tezini Ücretsiz Dene</Link>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Her akademik düzeye uygun analiz</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {levels.map((l) => {
              const Icon = l.icon
              return (
                <div key={l.title} className="feature-card text-center">
                  <div className="text-blue-600 flex justify-center mb-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{l.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{l.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 gradient-bg">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">Kılavuzlar farklı, standart yüksek</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Tez yazım kılavuzları üniversiteden üniversiteye değişse de jürilerin aradığı temel
            nitelikler benzerdir: net bir yapı, sağlam metodoloji, tutarlı kaynak gösterimi ve özgün
            katkı. TezAI bu boyutları tek tek değerlendirir; sen de raporu rehber alarak tezini
            kurumunun kılavuzuna göre son hâline getirirsin.
          </p>
          <p className="text-gray-600 mt-6">
            Analizin neleri kapsadığını{' '}
            <Link href="/tez-analizi" className="text-blue-600 font-semibold hover:underline">
              tez analizi sayfasında
            </Link>{' '}
            inceleyebilirsin.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Hangi üniversitede olursan ol, hazır ol</h2>
          <p className="text-blue-100 mb-8">Kayıt olana 10 ücretsiz kredi.</p>
          <Link href="/#app" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
            Ücretsiz Başla
          </Link>
        </div>
      </section>
    </div>
  )
}
