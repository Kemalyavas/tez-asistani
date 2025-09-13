export default function MesafeliSatisSozlesmesi() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Distance Sales Agreement (Terms of Sale)</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. PARTIES</h2>
            <div className="text-gray-700">
              <p><strong>Seller:</strong></p>
              <p>Company: Thesis Assistant</p>
              <p>Address: Kocaeli/Izmit</p>
              <p>Email: info@tezasistani.com</p>
              <p>Phone: 554 969 00 11</p>
              
              <p className="mt-4"><strong>Buyer:</strong></p>
              <p>The person specified during contract approval (checkout)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. SUBJECT</h2>
            <p className="text-gray-700">
              This agreement sets out the rights and obligations of the parties pursuant to the provisions of Turkish Consumer Protection Law No. 6502 regarding the sale and delivery of the service, the features of which are specified below together with its sales price, provided by the Seller to the Buyer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. SERVICE INFORMATION</h2>
            <div className="text-gray-700">
              <p><strong>Service Types:</strong></p>
              <ul className="list-disc pl-6 mt-2">
                <li>Free Plan: 1 thesis analysis credit</li>
                <li>Pro Plan: 30 thesis analyses per month - $9/month</li>
                <li>Expert Plan: Unlimited thesis analyses - $25/month</li>
              </ul>
              <p className="mt-3">
                Services are provided digitally and are activated immediately after purchase.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. PAYMENT INFORMATION</h2>
            <p className="text-gray-700">
              Payments are made by credit or debit card through Iyzico's secure payment infrastructure. Your payment information is protected with 256‑bit SSL encryption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. RIGHT OF WITHDRAWAL</h2>
            <p className="text-gray-700">
              Due to the nature of digital content and services, the right of withdrawal ends once the service begins to be used. Pursuant to Article 15(ğ) of Law No. 6502, the right of withdrawal does not apply to services performed instantly in electronic media.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. PRIVACY AND DATA SECURITY</h2>
            <p className="text-gray-700">
              Your personal data is protected under Turkish Personal Data Protection Law (KVKK). For details, please review our
              <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. JURISDICTION</h2>
            <p className="text-gray-700">
              For the implementation of this agreement, Consumer Arbitration Committees and Consumer Courts are authorized up to the monetary limits announced by the Ministry of Trade.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}