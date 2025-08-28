export default function TeslimatIade() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Teslimat ve İade Politikası</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Teslimat</h2>
            <div className="text-gray-700">
              <p className="mb-3">
                Tez Asistanı dijital bir hizmettir ve fiziksel teslimat gerektirmez.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ödeme onayından hemen sonra hesabınız aktif edilir</li>
                <li>Tüm özellikler anında kullanıma hazır olur</li>
                <li>E-posta adresinize onay maili gönderilir</li>
                <li>7/24 kesintisiz hizmet sunulmaktadır</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">İade Politikası</h2>
            <div className="text-gray-700">
              <h3 className="font-semibold mb-2">İade Koşulları:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hizmet satın alındıktan sonra hiç kullanılmamışsa</li>
                <li>Satın alma tarihinden itibaren 14 gün içinde başvuru yapılırsa</li>
                <li>Teknik bir sorun nedeniyle hizmet alınamıyorsa</li>
              </ul>

              <h3 className="font-semibold mt-4 mb-2">İade Edilemez Durumlar:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hizmet kullanılmaya başlandıysa (en az 1 analiz yapıldıysa)</li>
                <li>14 günlük süre aşıldıysa</li>
                <li>Kullanıcı hatası kaynaklı sorunlarda</li>
              </ul>

              <h3 className="font-semibold mt-4 mb-2">İade Süreci:</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>info@tezasistani.com adresine iade talebinizi gönderin</li>
                <li>Sipariş numaranız ve iade nedeninizi belirtin</li>
                <li>Talebiniz 3 iş günü içinde değerlendirilir</li>
                <li>Onaylanan iadeler 7-10 iş günü içinde kartınıza yansır</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Abonelik İptali</h2>
            <div className="text-gray-700">
              <p className="mb-3">
                Aylık aboneliklerinizi istediğiniz zaman iptal edebilirsiniz.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>İptal sonrası dönem sonuna kadar kullanmaya devam edebilirsiniz</li>
                <li>Otomatik yenileme durdurulur</li>
                <li>Kullanılmayan günler için iade yapılmaz</li>
                <li>İptal için hesap ayarlarından veya destek ile iletişime geçin</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Destek</h2>
            <div className="text-gray-700">
              <p>Sorularınız için bizimle iletişime geçin:</p>
              <p className="mt-2">
                <strong>E-posta:</strong> info@tezasistani.com<br/>
                <strong>Yanıt Süresi:</strong> 24-48 saat
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}