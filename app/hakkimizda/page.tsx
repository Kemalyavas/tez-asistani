import Link from 'next/link'
import { hakkimizdaMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = hakkimizdaMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Hakkımızda', url: absoluteUrl('/hakkimizda') },
])

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Hakkımızda</h1>
          <p className="text-lg text-gray-700">
            TezAI; tez yazarlarının akademik metinlerini yapay zeka ile analiz etmesini, kaynakça ve
            özet oluşturmasını sağlayan Türkiye merkezli bir akademik yazım platformudur.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Misyonumuz</h2>
            <p className="text-gray-700 leading-relaxed">
              Tez yazmak uzun ve yorucu bir süreçtir; biçim kuralları, kaynak gösterimi ve jüri
              beklentileri öğrencilerin asıl işine, yani araştırmaya ayırdığı zamanı azaltır.
              TezAI’nin amacı, bu mekanik yükü yapay zekaya devrederek tez yazarlarının içeriğe
              odaklanmasını sağlamaktır.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Neden TezAI?</h2>
            <p className="text-gray-700 leading-relaxed">
              TezAI, analizlerinde tek bir modele bağlı kalmaz; önde gelen birden fazla yapay zeka
              modelini birlikte kullanır ve kapsamlı analizlerde sonuçları çapraz doğrulamadan
              geçirir. Bu yaklaşım, değerlendirmelerin daha tutarlı ve güvenilir olmasını sağlar.
              Sonuçlar; net skorlar, eksik listesi ve önceliklendirilmiş düzeltme önerileri olarak
              sunulur.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Gizlilik ilkemiz</h2>
            <p className="text-gray-700 leading-relaxed">
              Tezin sana aittir. Yüklenen dosyalar SSL ile şifrelenir, analiz sonrası otomatik
              silinir, yapay zeka modellerini eğitmek için kullanılmaz ve hiçbir üçüncü tarafla
              paylaşılmaz. Tüm süreç KVKK ve GDPR ilkelerine uygun yürütülür. Ayrıntılar için{' '}
              <Link href="/privacy-policy" className="text-blue-600 font-semibold hover:underline">
                Gizlilik Politikası
              </Link>{' '}
              sayfasına bakabilirsin.
            </p>
          </div>

          <div className="text-center pt-4">
            <p className="text-gray-700 mb-6">
              Özellikleri keşfet veya bizimle iletişime geç.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/ozellikler" className="btn-primary">Özellikleri Gör</Link>
              <Link href="/iletisim" className="btn-secondary">İletişime Geç</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
