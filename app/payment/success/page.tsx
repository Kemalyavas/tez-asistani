// app/payment/success/page.tsx

import { Suspense } from 'react';
import PaymentSuccessClient from './client'; // Iyzico için oluşturulan client bileşeni

// Bu fonksiyon, sayfanın ana iskeletini oluşturur.
export default function PaymentSuccessPage() {
  return (
    // Suspense, client bileşeni yüklenirken bir "yükleniyor" ekranı göstermeyi sağlar.
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      {/* Ödeme doğrulama mantığını içeren asıl bileşen */}
      <PaymentSuccessClient />
    </Suspense>
  );
}