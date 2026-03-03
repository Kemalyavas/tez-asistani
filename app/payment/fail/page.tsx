'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, AlertTriangle, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown_error';

  const errorMessages: Record<string, { title: string; description: string; suggestion: string }> = {
    missing_token: {
      title: 'Ödeme Oturumu Sona Erdi',
      description: 'Ödeme oturumunun süresi doldu veya token eksik.',
      suggestion: 'Lütfen fiyatlandırma sayfasından yeni bir satın alma başlatın.'
    },
    payment_failed: {
      title: 'Ödeme Başarısız',
      description: 'Ödemeniz işleme alınamadı.',
      suggestion: 'Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.'
    },
    invalid_package: {
      title: 'Geçersiz Paket',
      description: 'Seçilen kredi paketi geçerli değil.',
      suggestion: 'Lütfen fiyatlandırma sayfasından geçerli bir paket seçin.'
    },
    user_not_found: {
      title: 'Kullanıcı Bulunamadı',
      description: 'Hesabınız bulunamadı.',
      suggestion: 'Lütfen giriş yaptığınızdan emin olun ve tekrar deneyin.'
    },
    credit_add_failed: {
      title: 'Kredi Eklenemedi',
      description: 'Ödeme başarılı ancak krediler hesabınıza eklenemedi.',
      suggestion: 'Lütfen ödeme bilgilerinizle destek ekibimize ulaşın.'
    },
    verification_failed: {
      title: 'Doğrulama Başarısız',
      description: 'Ödeme sağlayıcısıyla ödemeniz doğrulanamadı.',
      suggestion: 'Ücretlendirildiyseniz lütfen destek ekibimizle iletişime geçin.'
    },
    server_error: {
      title: 'Sunucu Hatası',
      description: 'Sunucularımızda beklenmedik bir hata oluştu.',
      suggestion: 'Lütfen daha sonra tekrar deneyin veya destek ekibimize ulaşın.'
    },
    unknown_error: {
      title: 'Bir Şeyler Ters Gitti',
      description: 'Ödeme sırasında beklenmedik bir hata oluştu.',
      suggestion: 'Lütfen tekrar deneyin. Sorun devam ederse destek ekibimize ulaşın.'
    }
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown_error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 mb-4">
            {errorInfo.description}
          </p>

          {/* Suggestion Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 text-left">
                {errorInfo.suggestion}
              </p>
            </div>
          </div>

          {/* Error Code (for support) */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">
              Hata Kodu: <code className="font-mono text-gray-700">{error}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="w-full btn-primary flex items-center justify-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Tekrar Dene
            </Link>

            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Ana Sayfaya Dön
            </Link>

            <a
              href="mailto:kemalyavaas@outlook.com"
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center py-2"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Destek Ekibine Ulaş
            </a>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Bu bir hata olduğunu düşünüyorsanız yukarıdaki hata koduyla destek ekibimizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
