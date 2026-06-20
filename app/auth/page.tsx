import { Suspense } from 'react';
import AuthComponent from '../components/Auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-paper-cool flex flex-col">
      {/* Üst bar */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-primary-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Ana sayfa
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          {/* Marka */}
          <div className="text-center mb-6">
            <Link href="/" className="font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">TezAI</Link>
            <div className="text-[14.5px] text-ink/50 mt-1.5">Akademik tez asistanı</div>
          </div>

          <Suspense fallback={<div className="text-center text-ink/40 py-10">Yükleniyor…</div>}>
            <AuthComponent />
          </Suspense>

          <p className="text-center text-[12.5px] text-ink/40 mt-5 leading-relaxed">
            Kayıt olarak{' '}
            <Link href="/privacy-policy" className="text-ink/60 underline">Gizlilik Politikası</Link>
            {' '}ve{' '}
            <Link href="/mesafeli-satis-sozlesmesi" className="text-ink/60 underline">kullanım koşullarını</Link>
            {' '}kabul edersin.
          </p>
        </div>
      </div>
    </div>
  );
}
