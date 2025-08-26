import AuthComponent from '../components/Auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Tez Asistanı'na Hoş Geldiniz
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ücretsiz hesap oluşturun ve 1 tez analizi hakkınızı kullanın
          </p>
        </div>
        
        <AuthComponent />
        
        <div className="text-center text-sm text-gray-500">
          Kayıt olarak <Link href="/privacy-policy" className="text-blue-600 hover:underline">Gizlilik Politikamızı</Link> kabul etmiş olursunuz.
        </div>
      </div>
    </div>
  );
}