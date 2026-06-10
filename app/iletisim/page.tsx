import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { iletisimMetadata } from '../lib/metadata'
import { structuredData } from '../lib/structuredData'
import { absoluteUrl } from '../lib/site'

export const metadata = iletisimMetadata

const breadcrumb = structuredData.generateBreadcrumb([
  { name: 'Ana Sayfa', url: absoluteUrl('/') },
  { name: 'İletişim', url: absoluteUrl('/iletisim') },
])

export default function IletisimPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">İletişim</h1>
          <p className="text-lg text-gray-700">
            Soru, geri bildirim, destek talebi veya iş birliği için bize ulaşabilirsin. Mesajlarına
            en kısa sürede dönüş yapıyoruz.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <a
              href="mailto:destek.tezai@gmail.com"
              className="card text-center hover:border-primary-200"
            >
              <Mail className="h-7 w-7 text-primary-600 mx-auto mb-3" />
              <h2 className="font-bold text-gray-800 mb-1">E-posta</h2>
              <p className="text-sm text-gray-600 break-all">destek.tezai@gmail.com</p>
            </a>
            <div className="card text-center">
              <Phone className="h-7 w-7 text-primary-600 mx-auto mb-3" />
              <h2 className="font-bold text-gray-800 mb-1">Telefon</h2>
              <p className="text-sm text-gray-600">554 969 00 11</p>
            </div>
            <div className="card text-center">
              <MapPin className="h-7 w-7 text-primary-600 mx-auto mb-3" />
              <h2 className="font-bold text-gray-800 mb-1">Konum</h2>
              <p className="text-sm text-gray-600">Kocaeli / İzmit, Türkiye</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold mb-3 text-gray-900">Aradığın cevap hazır olabilir</h2>
            <p className="text-gray-600 mb-6">
              Fiyatlar, atıf formatları, veri güvenliği ve kullanım hakkındaki yaygın soruların
              yanıtlarını Sık Sorulan Sorular sayfasında topladık.
            </p>
            <Link href="/sss" className="btn-primary">Sık Sorulan Sorular</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
