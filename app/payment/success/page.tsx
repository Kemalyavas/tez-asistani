// app/payment/success/page.tsx

import { Suspense } from 'react';
import PaymentSuccessClient from './client'; // Iyzico için oluşturulan client bileşeni

// Bu fonksiyon, sayfanın ana iskeletini oluşturur.
export default function PaymentSuccessPage() {
  return (
    // Suspense, client bileşeni yüklenirken bir "yükleniyor" ekranı göstermeyi sağlar.
    <Suspense fallback={
      <div className="min-h-screen bg-paper-cool flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-line-cool border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-ink/60">Ödeme doğrulanıyor…</p>
        </div>
      </div>
    }>
      {/* Ödeme doğrulama mantığını içeren asıl bileşen */}
      <PaymentSuccessClient />
    </Suspense>
  );
}