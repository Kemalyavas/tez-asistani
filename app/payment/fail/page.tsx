// app/payment/fail/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'token_yok':
        return 'Ödeme token\'ı bulunamadı. Lütfen tekrar deneyin.';
      case 'odeme_basarisiz':
        return 'Ödeme işlemi başarısız oldu. Kartınızı kontrol edip tekrar deneyin.';
      case 'sunucu_hatasi':
        return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      case 'belirsiz_durum':
        return 'Ödeme durumu belirsiz. Lütfen destek ile iletişime geçin.';
      default:
        return error ? decodeURIComponent(error) : 'Ödeme işlemi tamamlanamadı.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ödeme Başarısız
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-800 text-left">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            href="/#pricing" 
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center group"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Tekrar Dene
          </Link>
          
          <Link 
            href="/" 
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sorun devam ederse{' '}
            <a href="mailto:info@tezasistani.com" className="text-blue-600 hover:underline">
              destek ekibimizle
            </a>{' '}
            iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}