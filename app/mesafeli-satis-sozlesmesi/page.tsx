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
              <p>Şirket: TezAI</p>
              <p>Adres: Kocaeli/İzmit</p>
              <p>E-posta: kemalyavaas@outlook.com</p>
              <p>Telefon: 554 969 00 11</p>

              <p className="mt-4"><strong>Alıcı:</strong></p>
              <p>Sözleşme onayı sırasında (ödeme aşamasında) belirtilen kişi</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. KONU</h2>
            <p className="text-gray-700">
              İşbu sözleşme, Satıcı tarafından Alıcı&apos;ya sunulan, aşağıda özellikleri ve satış fiyatı belirtilen hizmetin satışı ve teslimi hakkında 6502 sayılı Tüketicinin Korunması Hakkında Kanun hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. HİZMET BİLGİLERİ</h2>
            <div className="text-gray-700">
              <p><strong>Kredi Tabanlı Sistem:</strong></p>
              <p className="mt-2 mb-3">TezAI kredi tabanlı bir sistemle çalışmaktadır. Kullanıcılar kredi paketleri satın alır ve çeşitli hizmetler için kredi kullanır:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Başlangıç Paketi: 50 kredi - 5$</li>
                <li>Standart Paket: 240 kredi (200 + 40 bonus) - 15$</li>
                <li>Pro Paket: 600 kredi (500 + 100 bonus) - 35$</li>
                <li>Ultimate Paket: 1500 kredi (1200 + 300 bonus) - 75$</li>
              </ul>
              <p className="mt-3"><strong>Kredi Kullanımı:</strong></p>
              <ul className="list-disc pl-6 mt-2">
                <li>Kaynak Formatlama: 1 kredi</li>
                <li>Özet Oluşturma: 3 kredi</li>
                <li>Tez Analizi (Kısa): 10 kredi</li>
                <li>Tez Analizi (Orta): 25 kredi</li>
                <li>Tez Analizi (Uzun): 50 kredi</li>
              </ul>
              <p className="mt-3">
                Krediler dijital olarak teslim edilir ve satın alma işleminden hemen sonra aktif hale gelir. Kredilerin kullanım süresi yoktur.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. ÖDEME BİLGİLERİ</h2>
            <p className="text-gray-700">
              Ödemeler, Iyzico&apos;nun güvenli ödeme altyapısı üzerinden kredi veya banka kartı ile yapılmaktadır. Ödeme bilgileriniz 256-bit SSL şifreleme ile korunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. CAYMA HAKKI</h2>
            <p className="text-gray-700">
              Dijital içerik ve hizmetlerin doğası gereği, hizmetin kullanılmaya başlanmasıyla cayma hakkı sona erer. 6502 sayılı Kanun&apos;un 15. maddesinin (ğ) bendi uyarınca, elektronik ortamda anında ifa edilen hizmetlerde cayma hakkı uygulanmaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. GİZLİLİK VE VERİ GÜVENLİĞİ</h2>
            <p className="text-gray-700">
              Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında korunmaktadır. Detaylı bilgi için
              <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">Gizlilik Politikamızı</a> inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. YETKİLİ MAHKEME</h2>
            <p className="text-gray-700">
              İşbu sözleşmenin uygulanmasında, Ticaret Bakanlığı tarafından ilan edilen parasal sınırlar dahilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}