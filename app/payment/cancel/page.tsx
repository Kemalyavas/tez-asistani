'use client'

import { X, ArrowLeft, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-600" />
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ödeme İptal Edildi
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ödeme işleminiz iptal edildi. Merak etmeyin, 
          herhangi bir ücret tahsil edilmedi.
        </p>

        {/* Reasons */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Neden İptal Ettiniz?</h3>
          <div className="text-sm text-gray-600 space-y-2 text-left">
            <p>• Farklı bir plan düşünüyor musunuz?</p>
            <p>• Ödeme yönteminizde sorun mu var?</p>
            <p>• Sorularınız mı var?</p>
          </div>
        </div>

        {/* Security & Trust */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-900">Güvenli Ödeme</span>
          </div>
          <p className="text-sm text-blue-800">
            Tüm ödemelerimiz SSL şifreli ve PCI DSS standartlarında 
            güvenli Stripe altyapısı üzerinden işlenmektedir.
          </p>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">Hatırlatma</h3>
          <ul className="text-sm text-green-800 space-y-1 text-left">
            <li>✅ İstediğiniz zaman iptal edebilirsiniz</li>
            <li>✅ İlk 7 gün para iade garantisi</li>
            <li>✅ 7/24 müşteri desteği</li>
            <li>✅ Güvenli ödeme altyapısı</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center group"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Tekrar Deneyin
          </Link>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Yardıma mı ihtiyacınız var?
          </p>
          <div className="space-y-2">
            <a
              href="mailto:info@tezasistani.com
"
              className="block text-blue-600 hover:underline text-sm"
            >
              📧 info@tezasistani.com

            </a>
            <a
              href="tel:+905551234567"
              className="block text-blue-600 hover:underline text-sm"
            >
              📞 +90 555 123 45 67
            </a>
            <Link
              href="/iletisim"
              className="block text-blue-600 hover:underline text-sm"
            >
              💬 Canlı Destek
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
