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
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Akademik Atıf Formatları: APA, MLA, Chicago, IEEE
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Doğru kaynak gösterimi, akademik bir çalışmanın güvenilirliğinin temelidir. TezAI; APA,
            MLA, Chicago ve IEEE formatlarında atıf ve kaynakçayı otomatik olarak oluşturur. Hangi
            formatın hangi alanda kullanıldığını aşağıda bulabilirsin.
          </p>
          <Link href="/#app" className="btn-primary">Kaynakçanı Ücretsiz Oluştur</Link>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {formats.map((f) => (
              <div key={f.name} className="card">
                <h2 className="text-2xl font-bold text-primary-600 mb-1">{f.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{f.full}</p>
                <p className="text-gray-700 leading-relaxed mb-4">{f.detail}</p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Yaygın kullanım alanları:</span> {f.fields}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 gradient-bg">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-6">TezAI ile kaynakça nasıl oluşturulur?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Kaynak bilgisini gir veya tezini yükle; istediğin formatı seç; TezAI atıfı ve kaynakça
            girişini saniyeler içinde, biçim kurallarına uygun olarak üretir. Tek bir kaynak
            biçimlendirmek yalnızca 1 kredi harcar.
          </p>
          <p className="text-gray-600 text-center">
            Tezinin tamamını kaynak tutarlılığı açısından kontrol ettirmek mi istiyorsun?{' '}
            <Link href="/tez-analizi" className="text-primary-600 font-semibold hover:underline">
              Tez analizi sayfasına göz at
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Doğru kaynakça, tek tıkla</h2>
          <p className="text-primary-100 mb-8">Kayıt olana 10 ücretsiz kredi.</p>
          <Link href="/#app" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
            Hemen Dene
          </Link>
        </div>
      </section>
    </div>
  )
}
