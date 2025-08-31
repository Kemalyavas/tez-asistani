'use client'

import { Check, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Ödeme Başarılı!
        </h1>
        <p className="text-gray-600 mb-6">
          Tebrikler! Planınız başarıyla aktifleştirildi. 
          Tüm premium özelliklere artık erişebilirsiniz.
        </p>
        <div className="space-y-3">
          <Link href="/" className="btn-primary w-full flex items-center justify-center group">
            Tez Asistanını Kullanmaya Başla
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/profile" className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
            <Home className="mr-2 h-4 w-4" />
            Profilime Git
          </Link>
        </div>
      </div>
    </div>
  )
}