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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#f6eeee' }}>
      <div className="max-w-md w-full">
        <div className="bg-white border border-line-cool rounded-[18px] shadow-[0_30px_64px_-38px_rgba(45,20,20,0.4)] p-9 text-center">
          {/* Error Icon */}
          <div className="w-[74px] h-[74px] bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop">
            <XCircle className="h-9 w-9" strokeWidth={2.4} style={{ color: '#be123c' }} />
          </div>

          {/* Error Title */}
          <h1 className="font-serif text-[26px] font-semibold tracking-tight text-ink mb-2.5">
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className="text-[15.5px] text-ink/60 mb-5">
            {errorInfo.description}
          </p>

          {/* Suggestion Box */}
          <div className="bg-[#fdf6e8] border border-[#f3e2bd] rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3 text-left">
              <AlertTriangle className="h-[18px] w-[18px] mt-0.5 flex-shrink-0" style={{ color: '#b45309' }} />
              <p className="text-[13.5px] leading-relaxed" style={{ color: '#92591a' }}>
                {errorInfo.suggestion}
              </p>
            </div>
          </div>

          {/* Error Code (for support) */}
          <div className="bg-[#f6f8f7] rounded-lg p-2.5 mb-6">
            <span className="text-xs text-ink/40">
              Hata kodu: <code className="font-mono text-ink/60">{error}</code>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full btn-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Tekrar dene
            </Link>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana sayfaya dön
            </Link>

            <a
              href="mailto:destek.tezai@gmail.com"
              className="w-full inline-flex items-center justify-center gap-2 text-primary-700 hover:underline text-[13.5px] font-semibold py-1.5"
            >
              <HelpCircle className="h-[15px] w-[15px]" />
              Destek ekibine ulaş
            </a>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-ink/50 mt-6">
          Bu bir hata olduğunu düşünüyorsanız yukarıdaki hata koduyla destek ekibimizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper-cool flex items-center justify-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-line-cool border-t-primary-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
