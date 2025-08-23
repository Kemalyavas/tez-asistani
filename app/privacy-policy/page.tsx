'use client';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Server, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-3xl font-bold text-gray-900">Veri Gizliliği Politikası</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Güvenlik Özeti */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-green-800">Güvenlik Taahhüdümüz</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Lock className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">SSL Şifreleme</h3>
                  <p className="text-gray-600 text-sm">Tüm verileriniz 256-bit SSL ile şifrelenir</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Trash2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Otomatik Silme</h3>
                  <p className="text-gray-600 text-sm">Dosyalar analiz sonrası otomatik silinir</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Eye className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Sıfır Paylaşım</h3>
                  <p className="text-gray-600 text-sm">Hiçbir veri üçüncü tarafla paylaşılmaz</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UserCheck className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">KVKK Uyumlu</h3>
                  <p className="text-gray-600 text-sm">Türk veri koruma mevzuatına uygun</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
            
            {/* 1. Toplanan Veriler */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-600" />
                1. Hangi Verileri Topluyoruz?
              </h2>
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Tez Dosyaları</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>PDF ve DOCX formatındaki tez dosyalarınız</li>
                  <li>Dosya adı ve boyut bilgileri</li>
                  <li>Yükleme tarihi ve saati</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">Kullanıcı Bilgileri</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>E-posta adresi (kayıt için)</li>
                  <li>IP adresi (güvenlik amacıyla)</li>
                  <li>Tarayıcı bilgileri (teknik destek için)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">Analiz Verileri</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Analiz sonuçları ve raporlar</li>
                  <li>Kullanım istatistikleri</li>
                  <li>Hata logları (sorun giderme için)</li>
                </ul>
              </div>
            </section>

            {/* 2. Veri Kullanımı */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Verilerinizi Nasıl Kullanıyoruz?</h2>
              <div className="prose max-w-none text-gray-700">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="font-semibold text-blue-800">Tek Amaç: Tez Analizi</p>
                  <p className="text-blue-700 text-sm mt-1">Tez dosyalarınız sadece ve sadece analiz hizmeti vermek için kullanılır.</p>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">Tez Dosyaları:</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>✅ YÖK formatına uygunluk kontrolü</li>
                  <li>✅ Atıf ve kaynak formatlama</li>
                  <li>✅ AI destekli analiz ve öneriler</li>
                  <li>❌ AI model eğitimi (KESİNLİKLE KULLANILMAZ)</li>
                  <li>❌ Başka kullanıcılarla paylaşım</li>
                  <li>❌ Ticari amaçlı kullanım</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">Kullanıcı Bilgileri:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Hesap yönetimi ve kimlik doğrulama</li>
                  <li>Teknik destek sağlama</li>
                  <li>Hizmet geliştirme (anonim istatistikler)</li>
                  <li>Güvenlik önlemleri</li>
                </ul>
              </div>
            </section>

            {/* 3. Veri Güvenliği */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Veri Güvenliği Önlemlerimiz</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3 text-gray-800">Teknik Güvenlik</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• 256-bit SSL/TLS şifreleme</li>
                    <li>• Güvenli sunucu altyapısı</li>
                    <li>• Düzenli güvenlik testleri</li>
                    <li>• Firewall koruması</li>
                    <li>• Otomatik yedekleme sistemi</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3 text-gray-800">Erişim Kontrolü</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Sınırlı personel erişimi</li>
                    <li>• İki faktörlü kimlik doğrulama</li>
                    <li>• Erişim logları tutulması</li>
                    <li>• Düzenli yetki gözden geçirme</li>
                    <li>• Gizlilik sözleşmeleri</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Veri Saklama */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Veri Saklama Süreleri</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-800 mb-3">⏱️ Otomatik Silme Politikası</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Tez Dosyaları</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">24 saat</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Analiz Sonuçları</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">30 gün</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Geçici Dosyalar</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">1 saat</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Hesap Bilgileri</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">Hesap silene kadar</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Kullanıcı Hakları */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Haklarınız (KVKK Kapsamında)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📋 Bilgi Alma Hakkı</h3>
                  <p className="text-sm text-gray-600">Hangi verilerinizin işlendiğini öğrenebilirsiniz</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✏️ Düzeltme Hakkı</h3>
                  <p className="text-sm text-gray-600">Yanlış bilgilerin düzeltilmesini isteyebilirsiniz</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🗑️ Silme Hakkı</h3>
                  <p className="text-sm text-gray-600">Verilerinizin silinmesini talep edebilirsiniz</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🚫 İtiraz Etme Hakkı</h3>
                  <p className="text-sm text-gray-600">Veri işlemeye itiraz edebilirsiniz</p>
                </div>
              </div>
            </section>

            {/* 6. Üçüncü Taraf Hizmetler */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Üçüncü Taraf Hizmetler</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">OpenAI (ChatGPT API)</h3>
                  <p className="text-sm text-gray-600 mb-2">AI analizi için kullanılır. OpenAI'ın veri politikası:</p>
                  <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                    <li>API üzerinden gönderilen veriler model eğitiminde kullanılmaz</li>
                    <li>Veriler 30 gün sonra otomatik silinir</li>
                    <li>GDPR ve veri koruma standartlarına uyumlu</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Supabase (Veritabanı)</h3>
                  <p className="text-sm text-gray-600 mb-2">Kullanıcı hesapları ve analiz sonuçları için:</p>
                  <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                    <li>SOC 2 Type II sertifikalı</li>
                    <li>GDPR uyumlu veri işleme</li>
                    <li>Amazon AWS'de güvenli hosting</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. İletişim */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. İletişim</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Veri gizliliği ile ilgili sorularınız, talepleriniz veya şikayetleriniz için:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>E-posta:</strong> privacy@tez-asistani.com</p>
                  <p><strong>Adres:</strong> Kocaeli/Izmit</p>
                  <p><strong>KVKK Sorumlusu:</strong> Ali Kemal Yavaş</p>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Yanıt Süresi:</strong> Talepleriniz en geç 2 hafta içinde yanıtlanır.
                  </p>
                </div>
              </div>
            </section>

  
          </div>

          {/* Alt Navigasyon */}
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
