export default function MesafeliSatisSozlesmesi() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Mesafeli Satış Sözleşmesi</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. TARAFLAR</h2>
            <div className="text-gray-700">
              <p><strong>Satıcı:</strong></p>
              <p>Ünvan: Tez Asistanı</p>
              <p>Adres: Kocaeli/İzmit</p>
              <p>E-posta: info@tezasistani.com</p>
              <p>Telefon: 554 969 00 11</p>
              
              <p className="mt-4"><strong>Alıcı:</strong></p>
              <p>Sözleşme onayı sırasında belirtilen kişi</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. KONU</h2>
            <p className="text-gray-700">
              İşbu sözleşmenin konusu, Satıcı'nın, Alıcı'ya satışını yaptığı, aşağıda özellikleri 
              ve satış fiyatı belirtilen hizmetin satışı ve teslimi ile ilgili olarak 6502 sayılı 
              Tüketicinin Korunması Hakkındaki Kanun hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. HİZMET BİLGİLERİ</h2>
            <div className="text-gray-700">
              <p><strong>Hizmet Türleri:</strong></p>
              <ul className="list-disc pl-6 mt-2">
                <li>Free Plan: 1 thesis analysis credit</li>
                <li>Pro Plan: 30 thesis analyses per month - $9/month</li>
                <li>Expert Plan: Unlimited thesis analyses - $25/month</li>
              </ul>
              <p className="mt-3">
                Hizmetler dijital olarak sunulmakta olup, satın alma sonrası anında aktif edilmektedir.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. ÖDEME BİLGİLERİ</h2>
            <p className="text-gray-700">
              Ödemeler Iyzico güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı 
              ile yapılmaktadır. Ödeme bilgileriniz 256-bit SSL şifreleme ile korunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. CAYMA HAKKI</h2>
            <p className="text-gray-700">
              Dijital içerik ve hizmet sunumu nedeniyle, hizmetin kullanılmaya başlanması ile 
              cayma hakkı sona erer. 6502 sayılı kanunun 15. maddesinin (ğ) bendi uyarınca, 
              elektronik ortamda anında ifa edilen hizmetler için cayma hakkı kullanılamaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. GİZLİLİK VE VERİ GÜVENLİĞİ</h2>
            <p className="text-gray-700">
              Kişisel verileriniz KVKK kapsamında korunmaktadır. Detaylı bilgi için 
              <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">Gizlilik Politikamızı</a> inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. YETKİLİ MAHKEME</h2>
            <p className="text-gray-700">
              İşbu sözleşmenin uygulanmasında, Sanayi ve Ticaret Bakanlığınca ilan edilen 
              değere kadar Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              Son güncelleme tarihi: {new Date().toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}