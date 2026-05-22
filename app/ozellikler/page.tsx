import Link from 'next/link'
import { FileSearch, BookOpen, Sparkles, ShieldCheck, Coins, Languages } from 'lucide-react'
import { ozelliklerMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = ozelliklerMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Özellikler', url: absoluteUrl('/ozellikler') },
])

const features = [
  {
    icon: FileSearch,
    title: 'Tez Analizi',
    desc: 'Yapı, metodoloji, literatür ve kaynak tutarlılığını yapay zeka ile değerlendirir; jüri öncesi eksikleri ve düzeltme önerilerini rapor hâlinde sunar.',
    href: '/tez-analizi',
    cta: 'Tez analizi nasıl çalışır?',
  },
  {
    icon: BookOpen,
    title: 'Otomatik Kaynakça',
    desc: 'APA, MLA, Chicago ve IEEE formatlarında atıf ve kaynakça üretir. Doğru biçim için kuralları ezberlemene gerek kalmaz.',
    href: '/akademik-formatlar',
    cta: 'Akademik formatları incele',
  },
  {
    icon: Sparkles,
    title: 'Özet (Abstract) Oluşturma',
    desc: 'PDF veya DOCX dosyandan Türkçe, İngilizce ya da her iki dilde, düzenleyebileceğin akademik özetler üretir.',
  },
  {
    icon: Languages,
    title: 'Format ve Dil Kontrolü',
    desc: 'Bölüm düzeni, başlık hiyerarşisi ve yazım kalitesini akademik standartlara göre kontrol eder, tutarsızlıkları işaretler.',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenlik ve Gizlilik',
    desc: 'Dosyaların SSL ile şifrelenir, analiz sonrası otomatik silinir ve yapay zeka modellerini eğitmek için kullanılmaz. KVKK ve GDPR uyumludur.',
  },
  {
    icon: Coins,
    title: 'Kredi Tabanlı, Abonelik Yok',
    desc: 'Yalnızca kullandığın kadar ödersin; krediler asla sona ermez. Aylık abonelik veya gizli ücret yoktur.',
    href: '/pricing',
    cta: 'Kredi paketlerini gör',
  },
]

export default function OzelliklerPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Hero */}
      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">TezAI Özellikleri</h1>
          <p className="text-lg text-gray-700 mb-8">
            TezAI, tez ve akademik metinlerini yapay zeka ile baştan sona destekleyen bir araç
            setidir. Tez analizinden otomatik kaynakçaya, özet oluşturmadan format kontrolüne kadar
            ihtiyacın olan her şey tek platformda.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/#app" className="btn-primary">Ücretsiz Dene</Link>
            <Link href="/pricing" className="btn-secondary">Fiyatları Gör</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="feature-card">
                  <div className="text-blue-600 mb-4">
                    <div className="inline-flex p-3 bg-blue-50 rounded-xl">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-800">{f.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                  {f.href && (
                    <Link
                      href={f.href}
                      className="inline-block mt-4 text-blue-600 font-semibold hover:text-blue-800"
                    >
                      {f.cta} →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-16 gradient-bg">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-6">Tek seferlik kontrol değil, revizyon döngüsü</h2>
          <p className="text-lg text-gray-700 text-center leading-relaxed">
            En iyi sonuç, birden fazla analiz turundan gelir. Tezini analiz et, raporun önerdiği
            düzeltmeleri uygula, sonra tekrar analiz et. Her turda metnin jüri ve akademik standartlara
            biraz daha yaklaşır. TezAI’nin kredi sistemi tam da bu döngü için tasarlandı: dilediğin
            kadar tur, abonelik baskısı olmadan.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Tezini bugün geliştirmeye başla</h2>
          <p className="text-blue-100 mb-8">Kayıt olana 10 ücretsiz kredi. Kredi kartı gerekmez.</p>
          <Link href="/#app" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
            Ücretsiz Başla
          </Link>
        </div>
      </section>
    </div>
  )
}
