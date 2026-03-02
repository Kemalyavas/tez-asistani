'use client'

import { useState, useEffect } from 'react'
import { Check, X, Coins, Sparkles, Zap, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'
import Script from 'next/script'
import { structuredData } from '../lib/structuredData'
import { CREDIT_PACKAGES, CREDIT_COSTS, getAnalysisTier, type CreditPackage } from '../lib/pricing'
import { useCredits } from '../hooks/useCredits'

// Credit cost display data
const CREDIT_ACTIONS = [
  {
    name: 'Kaynak Formatlama',
    credits: CREDIT_COSTS.citation_format.creditsRequired,
    description: 'APA, MLA, Chicago vb.'
  },
  {
    name: 'Özet Oluşturma',
    credits: CREDIT_COSTS.abstract_generate.creditsRequired,
    description: 'TR, EN veya Her İkisi'
  },
  {
    name: 'Tez Analizi (Temel)',
    credits: CREDIT_COSTS.thesis_basic.creditsRequired,
    description: '1-50 sayfa'
  },
  {
    name: 'Tez Analizi (Standart)',
    credits: CREDIT_COSTS.thesis_standard.creditsRequired,
    description: '51-100 sayfa'
  },
  {
    name: 'Tez Analizi (Kapsamlı)',
    credits: CREDIT_COSTS.thesis_comprehensive.creditsRequired,
    description: '100+ sayfa'
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { currentCredits, loading: creditsLoading, refresh: refreshCredits } = useCredits()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    getUser()
  }, [supabase])

  const handlePackageSelect = async (packageId: string) => {
    if (!user) {
      toast.error('Lütfen önce giriş yapın')
      router.push('/auth')
      return
    }

    if (packageId === 'free') {
      toast.success('Yeni kullanıcılar 10 ücretsiz kredi alır!')
      return
    }

    setLoading(packageId)

    try {
      const response = await fetch('/api/iyzico/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ödeme başlatılamadı')
      }

      // Redirect to Iyzico Checkout
      window.location.href = data.url

    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Ödeme başlatılamadı')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <Script
        id="breadcrumbs-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData.generateBreadcrumb([
              { name: 'Ana Sayfa', url: 'https://www.tezai.com.tr' },
              { name: 'Fiyatlandırma', url: 'https://www.tezai.com.tr/pricing' },
            ])
          ),
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Teziniz İçin <span className="text-blue-600">Kredi</span> Satın Alın
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Sadece kullandığınız kadar ödeyin. Abonelik yok, aylık ücret yok.
            Kredilerin süresi asla dolmaz.
          </p>

          {/* Current Credit Balance */}
          {user && (
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300 rounded-full px-6 py-3 shadow-sm">
              <Coins className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg text-blue-800">
                Bakiyeniz: <strong className="text-2xl">{creditsLoading ? '...' : currentCredits}</strong> kredi
              </span>
            </div>
          )}
        </div>

        {/* Credit Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {Object.values(CREDIT_PACKAGES).map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl bg-white shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                pkg.popular 
                  ? 'border-blue-500 scale-105 z-10' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" />
                    En Avantajlı
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">${pkg.priceUsd}</span>
                    <span className="text-sm text-gray-500 ml-1">(~₺{(pkg.priceUsd * 38).toLocaleString('tr-TR')} TL)</span>
                  </div>
                  
                  {/* Credits */}
                  <div className="bg-blue-50 rounded-lg py-3 px-4">
                    <div className="flex items-center justify-center">
                      <Coins className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-2xl font-bold text-blue-600">{pkg.credits}</span>
                      <span className="text-blue-600 ml-1">kredi</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="flex items-center justify-center mt-1 text-green-600 text-sm">
                        <Gift className="h-4 w-4 mr-1" />
                        +{pkg.bonusCredits} bonus kredi!
                      </div>
                    )}
                  </div>
                  
                  {/* Per Credit Price */}
                  <p className="text-sm text-gray-500 mt-2">
                    ${(pkg.priceUsd / pkg.totalCredits).toFixed(2)} kredi başına
                  </p>
                </div>

                {/* What you can do */}
                <div className="space-y-2 mb-6 text-sm">
                  <p className="font-medium text-gray-700">{pkg.totalCredits} kredi ile:</p>
                  <div className="text-gray-600 space-y-1">
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} orta tez analizi</p>
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} özet oluşturma</p>
                    <p>• ~{pkg.totalCredits} kaynak formatlama</p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePackageSelect(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === pkg.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Satın Al
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit Costs Table */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Kredi Maliyetleri
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">İşlem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Açıklama</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Kredi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {CREDIT_ACTIONS.map((action, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{action.name}</td>
                    <td className="px-6 py-4 text-gray-600">{action.description}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                        <Coins className="h-4 w-4 mr-1" />
                        {action.credits}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Free Credits Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 text-center">
            <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Yeni Kullanıcılar 10 Ücretsiz Kredi Kazanır!
            </h2>
            <p className="text-gray-600 mb-6">
              Şimdi kaydolun ve tez analiz araçlarımızı denemek için 10 kredi kazanın.
              Kredi kartı gerekmez.
            </p>
            {!user && (
              <button
                onClick={() => router.push('/auth')}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Ücretsiz Kayıt Ol
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Kredilerin süresi doluyor mu?</h3>
              <p className="text-gray-600">Hayır, kredilerinizin süresi asla dolmaz. İhtiyacınız olduğunda kullanın.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">İade alabilir miyim?</h3>
              <p className="text-gray-600">Teknik bir sorun nedeniyle analiz başarısız olursa, krediler otomatik olarak hesabınıza iade edilir.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Ödeme güvenli mi?</h3>
              <p className="text-gray-600">Tüm ödemeler SSL ile şifrelenir ve Iyzico&apos;nun PCI DSS uyumlu altyapısı üzerinden işlenir.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Neden abonelik yerine kredi sistemi?</h3>
              <p className="text-gray-600">Tez yazmak aylık bir aktivite değildir. Kredi sistemi ile sadece kullandığınız kadar ödersiniz, tekrarlayan ücretler konusunda endişelenmezsiniz.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">SSL Güvenlik</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">256-bit Şifreleme</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">PCI DSS Uyumlu</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">KVKK Uyumlu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
