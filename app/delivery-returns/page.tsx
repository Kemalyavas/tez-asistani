'use client';

import Link from 'next/link';
import Script from 'next/script';
import { structuredData } from '../lib/structuredData';
import { ArrowLeft, Zap, RefreshCw, CreditCard, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DeliveryReturns() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="breadcrumbs-delivery"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData.generateBreadcrumb([
              { name: 'Ana Sayfa', url: 'https://www.tezai.com.tr' },
              { name: 'Teslimat ve İade', url: 'https://www.tezai.com.tr/delivery-returns' },
            ])
          ),
        }}
      />

      {/* Başlık */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Teslimat ve İade Politikası</h1>
        </div>
      </div>

      {/* İçerik */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Özet */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Kısa Özet</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Zap className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Anında Teslimat</h3>
                  <p className="text-gray-600 text-sm">Ödeme sonrası krediler hesabınıza anında eklenir</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RefreshCw className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Otomatik İade</h3>
                  <p className="text-gray-600 text-sm">Analiz başarısız olursa krediler otomatik iade edilir</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Sona Ermez</h3>
                  <p className="text-gray-600 text-sm">Kredileriniz hiçbir zaman sona ermez, istediğinizde kullanın</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

            {/* Teslimat */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                1. Teslimat
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI dijital bir hizmettir. Fiziksel teslimat söz konusu değildir.
                </p>
                <h3 className="text-lg font-semibold mb-2">Nasıl Çalışır:</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Başarılı ödeme sonrası krediler hesabınıza <strong>anında eklenir</strong></li>
                  <li>Faturanızla birlikte onay e-postası alırsınız</li>
                  <li>Krediler hemen kullanıma hazırdır</li>
                  <li>Hizmetimiz 7/24 erişilebilirdir</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Not:</strong> Ödeme sonrası 5 dakika içinde krediler görünmezse kemalyavaas@outlook.com adresinden bize ulaşın.
                  </p>
                </div>
              </div>
            </section>

            {/* Kredi Sistemi */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                2. Kredi Sistemi
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI kredi tabanlı bir sistem kullanır. Kredi satın alır, çeşitli hizmetlerde kullanırsınız:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Hizmet</th>
                        <th className="text-right py-2">Kredi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Kaynak Formatlama</td>
                        <td className="text-right">1 kredi</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Özet Oluşturma</td>
                        <td className="text-right">3 kredi</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Tez Analizi (Kısa)</td>
                        <td className="text-right">10 kredi</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Tez Analizi (Orta)</td>
                        <td className="text-right">25 kredi</td>
                      </tr>
                      <tr>
                        <td className="py-2">Tez Analizi (Uzun)</td>
                        <td className="text-right">50 kredi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p><strong>Krediler asla sona ermez.</strong> İhtiyaç duyduğunuzda kullanın.</p>
              </div>
            </section>

            {/* İade Politikası */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                3. İade Politikası
              </h2>
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Otomatik Kredi İadesi
                </h3>
                <p className="mb-4">
                  Bizim tarafımızdaki teknik bir sorun nedeniyle analiz başarısız olursa, krediler hesabınıza <strong>otomatik olarak iade edilir</strong>. Sizin herhangi bir işlem yapmanıza gerek yoktur.
                </p>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Parasal İade Koşulları
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Krediler <strong>hiç kullanılmamış</strong> olmalıdır</li>
                  <li>Satın alma tarihinden itibaren <strong>14 gün</strong> içinde talep edilmelidir</li>
                  <li>Teknik sorunlar hizmeti kullanmanızı engelliyorsa</li>
                </ul>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  İade Yapılmayan Durumlar
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Krediler kısmen veya tamamen kullanılmışsa</li>
                  <li>Satın alma tarihinden itibaren 14 gün geçmişse</li>
                  <li>Kullanıcı hatasından kaynaklanan sorunlar (yanlış dosya formatı vb.)</li>
                </ul>
                <h3 className="text-lg font-semibold mb-3">İade Talebi Nasıl Yapılır</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>kemalyavaas@outlook.com</strong> adresine e-posta gönderin</li>
                  <li>Kayıtlı e-posta adresinizi ve ödeme tarihini belirtin</li>
                  <li>İade talebinizin nedenini açıklayın</li>
                  <li><strong>3 iş günü</strong> içinde yanıt veririz</li>
                  <li>Onaylanan iadeler <strong>7-10 iş günü</strong> içinde işleme alınır</li>
                </ol>
              </div>
            </section>

            {/* İletişim */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                4. Bize Ulaşın
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Teslimat, kredi veya iade konularındaki sorularınız için:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>E-posta:</strong> kemalyavaas@outlook.com</p>
                  <p><strong>Yanıt Süresi:</strong> 24-48 saat içinde</p>
                </div>
              </div>
            </section>

          </div>

          {/* Alt Navigasyon */}
          <div className="mt-12 text-center">
            <Link href="/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
