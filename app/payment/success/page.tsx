'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

function PaymentSuccessContent() {
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Ödeme bilgilerini doğrula
      verifyPayment()
    } else {
      router.push('/pricing')
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSessionData(data)
      } else {
        router.push('/pricing')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      router.push('/pricing')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ödemeniz doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Ödeme Başarılı!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tebrikler! Planınız başarıyla aktifleştirildi. 
          Artık tüm premium özelliklerden faydalanabilirsiniz.
        </p>

        {/* Plan Details */}
        {sessionData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Plan Detayları</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Plan:</span> {sessionData.plan_name}</p>
              <p><span className="font-medium">Tutar:</span> ₺{sessionData.amount}</p>
              <p><span className="font-medium">Dönem:</span> {sessionData.billing_cycle}</p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Sıradaki Adımlar</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>✅ Planınız aktifleştirildi</li>
            <li>✅ Faturanız email adresinize gönderildi</li>
            <li>✅ Artık premium özelliklerden faydalanabilirsiniz</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center group"
          >
            Tez Asistanını Kullanmaya Başla
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/profile"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Profilime Git
          </Link>
        </div>

        {/* Support */}
        <p className="text-xs text-gray-500 mt-6">
          Herhangi bir sorunuz varsa{' '}
          <a href="mailto:destek@tezasistani.com" className="text-blue-600 hover:underline">
            destek@tezasistani.com
          </a>{' '}
          adresinden bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
