import Link from 'next/link'
import { hakkimizdaMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = hakkimizdaMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Hakkımızda', url: absoluteUrl('/hakkimizda') },
])

const faq = structuredData.generateFAQ([
  {
    question: 'TezAI nedir?',
    answer:
      'TezAI, akademik tezleri yapay zeka ile değerlendiren Türkiye merkezli bir yazım asistanıdır. Tez analizi, atıf/kaynakça oluşturma ve özet (abstract) yazımı olmak üzere üç temel araç sunar. Amacı, biçim ve kaynak gösterimi gibi mekanik yükü azaltarak yazarın araştırmaya odaklanmasını sağlamaktır.',
  },
  {
    question: 'TezAI tezi nasıl değerlendiriyor?',
    answer:
      'TezAI, tezi 50’den fazla akademik kriter üzerinden, yapısal bir değerlendirme rubriği ile inceler. Her bulguyu tezin ilgili sayfasına bağlar ve skorlama, modelin keyfi bir notuyla değil, kurallara dayalı deterministik bir hesaplama ile yapılır. Bu sayede aynı tez her seferinde tutarlı bir sonuç alır.',
  },
  {
    question: 'TezAI hangi yapay zeka modellerini kullanıyor?',
    answer:
      'TezAI tek bir modele bağlı kalmaz; analizlerde önde gelen birden fazla yapay zeka modelini birlikte kullanır ve kapsamlı değerlendirmelerde sonuçları çapraz doğrulamadan geçirir. Bu yaklaşım, tek bir modelin hatasına bağlı kalmadan daha güvenilir bir değerlendirme üretmeyi hedefler.',
  },
  {
    question: 'Yüklediğim tez güvende mi?',
    answer:
      'Evet. Yüklenen dosyalar SSL ile şifrelenir, analiz sonrası otomatik olarak silinir, yapay zeka modellerini eğitmek için kullanılmaz ve hiçbir üçüncü tarafla paylaşılmaz. Tüm süreç KVKK ve GDPR ilkelerine uygun yürütülür.',
  },
  {
    question: 'TezAI tezimi benim yerime yazıyor mu?',
    answer:
      'Hayır. TezAI bir yazma aracı değil, bir değerlendirme ve düzeltme asistanıdır. Tezini senin yerine yazmaz; mevcut metnindeki eksikleri, biçim hatalarını ve geliştirilebilecek noktaları gösterir. Son karar ve yazım her zaman yazara aittir.',
  },
])

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Hakkımızda</h1>
          <p className="text-lg text-gray-700">
            TezAI; tez yazarlarının akademik metinlerini yapay zeka ile analiz etmesini, kaynakça ve
            özet oluşturmasını sağlayan Türkiye merkezli bir akademik yazım platformudur. Türk
            yükseköğretim sistemindeki tez yazarları için, Türkçe akademik dil ve YÖK kuralları göz
            önünde tutularak tasarlandı.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl space-y-12">
          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">TezAI nedir?</h2>
            <p className="text-gray-700 leading-relaxed">
              TezAI, lisans, yüksek lisans ve doktora tezi yazan herkesin metnini teslim etmeden önce
              objektif bir değerlendirmeden geçirebileceği bir akademik yazım asistanıdır. Tezini
              yükle, dakikalar içinde yapısal bir analiz al: hangi bölümler güçlü, nereler eksik,
              hangi biçim kuralları ihlal edilmiş ve önce neyi düzeltmen gerekiyor. TezAI üç araçtan
              oluşur:{' '}
              <Link href="/tez-analizi" className="text-primary-600 font-semibold hover:underline">
                tez analizi
              </Link>
              ,{' '}
              <Link
                href="/akademik-formatlar"
                className="text-primary-600 font-semibold hover:underline"
              >
                atıf ve kaynakça oluşturucu
              </Link>{' '}
              ve özet (abstract) yazım yardımı.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Misyonumuz</h2>
            <p className="text-gray-700 leading-relaxed">
              Tez yazmak uzun ve yorucu bir süreçtir; biçim kuralları, kaynak gösterimi ve jüri
              beklentileri, öğrencilerin asıl işine —yani araştırmaya— ayırdığı zamanı azaltır. Bir
              danışmanla görüşmeler arasında geçen haftalar, küçük bir biçim hatası yüzünden geri
              dönen bölümler ve “acaba bu kaynakçayı doğru mu yazdım” kaygısı sürecin çoğunu kaplar.
              TezAI’nin amacı bu mekanik yükü yapay zekaya devrederek tez yazarının zihnini içeriğe,
              argümana ve katkıya odaklamaktır.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Nasıl çalışır?</h2>
            <p className="text-gray-700 leading-relaxed">
              TezAI’yi diğer “yapay zekaya sor” araçlarından ayıran şey, değerlendirmesini bir
              rubriğe dayandırmasıdır. Tezini, 50’den fazla akademik kriterden oluşan yapısal bir
              değerlendirme listesi üzerinden inceler: giriş ve problem tanımı, literatür taraması,
              yöntem, bulgular, tartışma, sonuç, dil ve biçim. Her bulgu tezin ilgili sayfasına
              bağlanır, böylece “şurada şu eksik” dediğinde nereye bakacağını bilirsin. Skorlama ise
              modelin keyfi bir notuyla değil, kurallara dayalı deterministik bir hesaplama ile
              yapılır — yani aynı tez her seferinde aynı sonucu alır. Süreci adım adım{' '}
              <Link href="/ozellikler" className="text-primary-600 font-semibold hover:underline">
                özellikler sayfasında
              </Link>{' '}
              inceleyebilirsin.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Neden TezAI?</h2>
            <p className="text-gray-700 leading-relaxed">
              TezAI, analizlerinde tek bir modele bağlı kalmaz; önde gelen birden fazla yapay zeka
              modelini birlikte kullanır ve kapsamlı analizlerde sonuçları çapraz doğrulamadan
              geçirir. Bu yaklaşım, değerlendirmelerin daha tutarlı ve güvenilir olmasını sağlar.
              Sonuçlar; net skorlar, eksik listesi ve önceliklendirilmiş düzeltme önerileri olarak
              sunulur. Üstelik araç Türkçe akademik dile ve Türkiye’deki tez yazım geleneğine göre
              tasarlandığı için, İngilizce için yapılmış genel amaçlı araçların gözden kaçırdığı
              ayrıntıları yakalar.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Dürüstlük taahhüdümüz</h2>
            <p className="text-gray-700 leading-relaxed">
              TezAI bir yazma değil, bir <strong>değerlendirme ve düzeltme</strong> asistanıdır.
              Tezini senin yerine yazmaz, intihal üretmez ve sana sahte bir “%100 hazır” güvencesi
              vermez. Yaptığı iş, mevcut metnindeki eksikleri açıkça göstermek ve neyi önce
              düzeltmen gerektiğini söylemektir. Son söz her zaman yazara aittir. Fiyatlandırmada da
              aynı şeffaflığı benimseriz: gizli ücret, otomatik yenilenen abonelik veya sona eren
              kredi yoktur. Ayrıntılar{' '}
              <Link href="/pricing" className="text-primary-600 font-semibold hover:underline">
                fiyatlandırma sayfasında
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Gizlilik ilkemiz</h2>
            <p className="text-gray-700 leading-relaxed">
              Tezin sana aittir. Yüklenen dosyalar SSL ile şifrelenir, analiz sonrası otomatik
              silinir, yapay zeka modellerini eğitmek için kullanılmaz ve hiçbir üçüncü tarafla
              paylaşılmaz. Tüm süreç KVKK ve GDPR ilkelerine uygun yürütülür. Ayrıntılar için{' '}
              <Link href="/privacy-policy" className="text-primary-600 font-semibold hover:underline">
                Gizlilik Politikası
              </Link>{' '}
              sayfasına bakabilirsin.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Faydalı rehberler</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tez yazım sürecinde işine yarayacak, ücretsiz ve detaylı rehberlerimiz:
            </p>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>
                <Link
                  href="/blog/tez-yazim-asamalari"
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Tez yazım aşamaları: baştan sona adım adım
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/yok-tez-yazim-kurallari"
                  className="text-primary-600 font-semibold hover:underline"
                >
                  YÖK tez yazım kuralları rehberi
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/apa-7-kaynakca-nasil-yapilir"
                  className="text-primary-600 font-semibold hover:underline"
                >
                  APA 7 kaynakça nasıl yapılır?
                </Link>
              </li>
              <li>
                <Link
                  href="/blog/tez-ozeti-abstract-nasil-yazilir"
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Tez özeti (abstract) nasıl yazılır?
                </Link>
              </li>
            </ul>
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
