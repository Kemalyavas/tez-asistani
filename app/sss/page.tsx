import Link from 'next/link'
import { sssMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = sssMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'Sık Sorulan Sorular', url: absoluteUrl('/sss') },
])

// Görünür içerik ile JSON-LD aynı kaynaktan üretilir → schema-içerik eşleşmesi garanti
const faqs = [
  {
    q: 'TezAI nedir ve nasıl çalışır?',
    a: 'TezAI, yapay zeka destekli bir akademik yazım platformudur. Tezini PDF veya DOCX olarak yüklersin; sistem yapı, metodoloji, literatür, kaynak ve dil boyutlarında analiz eder ve sana skorlar ile düzeltme önerileri içeren bir rapor sunar. Ayrıca atıf biçimlendirme ve özet oluşturma araçları da içerir.',
  },
  {
    q: 'Hangi dosya formatlarını yükleyebilirim?',
    a: 'PDF ve Word (DOCX) dosyalarını yükleyebilirsin. Dosya boyutu üst sınırı 10 MB’dir.',
  },
  {
    q: 'Hangi atıf formatları destekleniyor?',
    a: 'APA 7, MLA 9, Chicago 17 ve IEEE formatlarını destekliyoruz. Hangi formatın hangi alanda kullanıldığını Akademik Formatlar sayfasında inceleyebilirsin.',
  },
  {
    q: 'Başlamak için kredi kartı gerekiyor mu?',
    a: 'Hayır. Kayıt olunca anında 10 ücretsiz kredi kazanırsın; bu, tam bir tez analizi veya birden fazla kaynak ve özet için yeterlidir. Kredi kartı gerekmez.',
  },
  {
    q: 'Krediler sona erer mi?',
    a: 'Hayır, kredilerin asla sona ermez. Bir kez satın al, ihtiyaç duyduğunda kullan. Aylık ücret veya abonelik yoktur.',
  },
  {
    q: 'Verilerim ve tezim güvende mi?',
    a: 'Evet. Yüklenen dosyalar SSL ile şifrelenir, analiz sonrası otomatik silinir, yapay zeka modellerini eğitmek için kullanılmaz ve üçüncü taraflarla paylaşılmaz. Tüm süreç KVKK ve GDPR ilkelerine uygundur.',
  },
  {
    q: 'İade alabilir miyim?',
    a: 'Teknik bir sorun nedeniyle analiz başarısız olursa, harcanan krediler otomatik olarak hesabına iade edilir.',
  },
  {
    q: 'Hangi kredi paketini seçmeliyim?',
    a: 'Tek bir tez için Starter veya Standart paket genellikle yeterlidir. Birden fazla proje üzerinde çalışıyorsan veya en iyi değeri istiyorsan Pro paketi 500 kredi sunar. Tüm paketleri Fiyatlar sayfasında görebilirsin.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function SssPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Sık Sorulan Sorular</h1>
          <p className="text-lg text-gray-700">
            TezAI hakkında en çok merak edilenler. Aradığını bulamazsan{' '}
            <Link href="/iletisim" className="text-primary-600 font-semibold hover:underline">
              iletişim
            </Link>{' '}
            sayfasından bize ulaşabilirsin.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-gray-50 rounded-lg p-6">
                <h2 className="font-semibold text-gray-900 mb-2">{f.q}</h2>
                <p className="text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/#app" className="btn-primary">Tezini Ücretsiz Dene</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
