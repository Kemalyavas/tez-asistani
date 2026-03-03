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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Ödeme Başarılı!
        </h1>
        <p className="text-gray-600 mb-4">
          Kredileriniz hesabınıza eklendi.
        </p>

        {/* Credit Info */}
        {credits && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-700">
              <Coins className="h-6 w-6" />
              <span className="text-2xl font-bold">+{credits}</span>
              <span className="text-lg">kredi</span>
            </div>
            {balance && (
              <p className="text-sm text-blue-600 mt-2">
                Yeni bakiye: <strong>{balance}</strong> kredi
              </p>
            )}
            {packageName && (
              <p className="text-sm text-gray-500 mt-1">
                Paket: {packageName}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link href="/" className="btn-primary w-full flex items-center justify-center group">
            Kredileri Kullanmaya Başla
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/profile" className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
            <Home className="mr-2 h-4 w-4" />
            Profilimi Görüntüle
          </Link>
        </div>
      </div>
    </div>
  )
}
