'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Coins, AlertTriangle, ArrowRight, Home, RefreshCw } from 'lucide-react';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'unknown';
  const error = searchParams.get('error');
  const packageName = searchParams.get('package');
  const credits = searchParams.get('credits');
  const balance = searchParams.get('balance');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: isSuccess ? '#eaf3ed' : '#f6eeee' }}>
      <div className="max-w-md w-full">
        <div className={`bg-white border border-line-cool rounded-[18px] p-9 text-center ${isSuccess ? 'shadow-[0_30px_64px_-38px_rgba(20,28,55,0.45)]' : 'shadow-[0_30px_64px_-38px_rgba(45,20,20,0.4)]'}`}>
          {/* Status Icon */}
          <div className="mb-6">
            {isSuccess ? (
              <div className="w-[74px] h-[74px] bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pop">
                <CheckCircle className="h-9 w-9" strokeWidth={2.4} style={{ color: '#15803d' }} />
              </div>
            ) : (
              <div className="w-[74px] h-[74px] bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pop">
                <XCircle className="h-9 w-9" strokeWidth={2.4} style={{ color: '#be123c' }} />
              </div>
            )}
          </div>

          {/* Status Title */}
          <h1 className="font-serif text-[26px] font-semibold tracking-tight text-ink mb-2.5">
            {isSuccess ? 'Ödeme başarılı' : 'Ödeme başarısız'}
          </h1>

          {/* Status Description */}
          {isSuccess ? (
            <p className="text-[15.5px] text-ink/60 mb-6">
              Kredilerin hesabına eklendi.
            </p>
          ) : (
            <p className="text-[15.5px] text-ink/60 mb-5">
              {error || 'Ödemen işleme alınamadı.'}
            </p>
          )}

          {/* Success Details */}
          {isSuccess && (
            <div className="space-y-3 mb-6">
              {/* Credits Added */}
              {credits && (
                <div className="bg-primary-50 rounded-xl p-[18px]">
                  <div className="flex items-center justify-center gap-2.5 text-primary-700">
                    <Coins className="h-6 w-6" />
                    <span className="font-serif text-[30px] font-semibold">+{credits}</span>
                    <span className="text-[17px]">kredi</span>
                  </div>
                  {packageName && (
                    <p className="text-[13.5px] text-primary-700/80 mt-2">
                      {packageName} Paketi
                    </p>
                  )}
                </div>
              )}

              {/* New Balance */}
              {balance && (
                <div className="bg-[#f6f8f7] rounded-lg p-2.5">
                  <p className="text-[13.5px] text-ink/60">
                    Yeni bakiye: <strong className="text-ink">{balance} kredi</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {!isSuccess && error && (
            <div className="bg-[#fdf6e8] border border-[#f3e2bd] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle className="h-[18px] w-[18px] mt-0.5 flex-shrink-0" style={{ color: '#b45309' }} />
                <p className="text-[13.5px] leading-relaxed" style={{ color: '#92591a' }}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isSuccess ? (
              <>
                <Link
                  href="/"
                  className="w-full btn-primary group"
                >
                  Analiz etmeye başla
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/profile"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Profilimi görüntüle
                </Link>
              </>
            ) : (
              <>
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
                  <Home className="h-4 w-4" />
                  Ana sayfaya dön
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        {!isSuccess && (
          <p className="text-center text-sm text-ink/50 mt-6">
            Ücretlendirildiyseniz ancak kredi almadıysanız lütfen{' '}
            <a href="mailto:destek.tezai@gmail.com" className="text-primary-700 hover:underline">
              destek.tezai@gmail.com
            </a>{' '}
            ile iletişime geçin.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper-cool flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-line-cool border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-ink/60">Ödeme doğrulanıyor…</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
