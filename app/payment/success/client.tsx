'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'completed') {
      // 5 saniye sonra ana sayfaya yönlendir
      const timer = setTimeout(() => {
        router.push('/');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

  if (status !== 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Ödeme işlemi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödeme Başarılı!
          </h1>
          <p className="text-gray-600 mb-6">
            Pro üyeliğiniz aktif edildi. Artık tüm özellikleri kullanabilirsiniz.
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Ana Sayfaya Dön
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            5 saniye içinde yönlendirileceksiniz...
          </p>
        </div>
      </div>
    </div>
  );
}