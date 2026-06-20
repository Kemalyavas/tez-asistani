'use client'
import { Check, ArrowRight, Home, Coins } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams()
  const credits = searchParams.get('credits')
  const balance = searchParams.get('balance')
  const packageName = searchParams.get('package')

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#eaf3ed' }}>
      <div className="max-w-md w-full bg-white border border-line-cool rounded-[18px] shadow-[0_30px_64px_-38px_rgba(20,28,55,0.45)] p-9 text-center">
        <div className="w-[74px] h-[74px] bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop">
          <Check className="w-9 h-9" strokeWidth={2.6} style={{ color: '#15803d' }} />
        </div>
        <h1 className="font-serif text-[28px] font-semibold tracking-tight text-ink mb-2.5">
          Ödeme başarılı
        </h1>
        <p className="text-[15.5px] text-ink/60 mb-6">
          Kredilerin hesabına eklendi.
        </p>

        {/* Credit Info */}
        {credits && (
          <div className="bg-primary-50 rounded-xl p-[18px] mb-6">
            <div className="flex items-center justify-center gap-2.5 text-primary-700">
              <Coins className="h-6 w-6" />
              <span className="font-serif text-[30px] font-semibold">+{credits}</span>
              <span className="text-[17px]">kredi</span>
            </div>
            {(balance || packageName) && (
              <p className="text-[13.5px] text-primary-700/80 mt-2">
                {balance && <>Yeni bakiye: <strong>{balance}</strong> kredi</>}
                {balance && packageName && ' · '}
                {packageName}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary w-full group">
            Kredileri kullanmaya başla
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/profile" className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
            <Home className="h-4 w-4" />
            Profilimi görüntüle
          </Link>
        </div>
      </div>
    </div>
  )
}
