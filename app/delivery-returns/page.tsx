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

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Teslimat ve İade Politikası</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Quick Summary */}
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
                  <h3 className="font-semibold text-gray-800">Hata Durumunda Otomatik İade</h3>
                  <p className="text-gray-600 text-sm">Analiz başarısız olursa krediler otomatik olarak iade edilir</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Süresiz Kullanım</h3>
                  <p className="text-gray-600 text-sm">Kredilerinizin kullanım süresi yoktur - istediğiniz zaman kullanın</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

            {/* Delivery */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                1. Teslimat
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI dijital bir hizmettir. Fiziksel teslimat bulunmamaktadır.
                </p>

                <h3 className="text-lg font-semibold mb-2">Nasıl Çalışır:</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Başarılı ödeme sonrası krediler hesabınıza <strong>anında eklenir</strong></li>
                  <li>Makbuzunuzu içeren bir onay e-postası alırsınız</li>
                  <li>Krediler hemen kullanıma hazırdır</li>
                  <li>Hizmetimiz 7/24 kullanılabilir</li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Not:</strong> Ödemeden sonra 5 dakika içinde krediler görünmezse lütfen kemalyavaas@outlook.com adresinden bizimle iletişime geçin
                  </p>
                </div>
              </div>
            </section>

            {/* Credit System */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                2. Kredi Sistemi
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI kredi tabanlı bir sistem kullanmaktadır. Kredi satın alır ve çeşitli hizmetler için kullanırsınız:
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

                <p><strong>Kredilerin kullanım süresi yoktur.</strong> İhtiyacınız olduğunda istediğiniz zaman kullanabilirsiniz.</p>
              </div>
            </section>

            {/* Refund Policy */}
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
                  Tarafımızdan kaynaklanan teknik bir sorun nedeniyle analiz başarısız olursa, krediler hesabınıza <strong>otomatik olarak iade edilir</strong>. Sizin herhangi bir işlem yapmanıza gerek yoktur.
                </p>

                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Para İadesi Yapılabilecek Durumlar
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Krediler hiç <strong>kullanılmamış</strong> olmalıdır</li>
                  <li>Talep, satın alma tarihinden itibaren <strong>14 gün</strong> içinde yapılmalıdır</li>
                  <li>Teknik sorunlar hizmeti kullanmanızı engellemiş olmalıdır</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  İade Yapılamayacak Durumlar
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Krediler kısmen veya tamamen kullanılmışsa</li>
                  <li>Satın alma tarihinden itibaren 14 günden fazla süre geçmişse</li>
                  <li>Kullanıcı hatasından kaynaklanan sorunlar (yanlış dosya formatı vb.)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">İade Talebi Nasıl Yapılır</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>kemalyavaas@outlook.com</strong> adresine e-posta gönderin</li>
                  <li>Kayıtlı e-posta adresinizi ve ödeme tarihini belirtin</li>
                  <li>İade talebinizin nedenini açıklayın</li>
                  <li><strong>3 iş günü</strong> içinde yanıt vereceğiz</li>
                  <li>Onaylanan iadeler <strong>7-10 iş günü</strong> içinde işleme alınır</li>
                </ol>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                4. Bize Ulaşın
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Teslimat, kredi veya iade hakkında sorularınız için:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>E-posta:</strong> kemalyavaas@outlook.com</p>
                  <p><strong>Yanıt Süresi:</strong> 24-48 saat içinde</p>
                </div>
              </div>
            </section>

          </div>

          {/* Back Navigation */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
