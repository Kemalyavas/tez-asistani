'use client'

import { useState, useEffect } from 'react'
import { Check, Coins, Sparkles, Zap, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'
import Script from 'next/script'
import { structuredData } from '../lib/structuredData'
import { CREDIT_PACKAGES, CREDIT_COSTS } from '../lib/pricing'
import { useCredits } from '../hooks/useCredits'

// Kredi maliyet tablosu verileri
const CREDIT_ACTIONS = [
  {
    name: 'Atıf Biçimlendirme',
    credits: CREDIT_COSTS.citation_format.creditsRequired,
    description: 'APA, MLA, Chicago, IEEE'
  },
  {
    name: 'Özet Oluşturma',
    credits: CREDIT_COSTS.abstract_generate.creditsRequired,
    description: 'Türkçe, İngilizce veya Her İkisi'
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
  const { currentCredits, loading: creditsLoading } = useCredits()

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
      toast.success('Yeni kullanıcılar 10 ücretsiz kredi kazanır!')
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

      window.location.href = data.url

    } catch (error: any) {
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
              { name: 'Fiyatlar', url: 'https://www.tezai.com.tr/pricing' },
            ])
          ),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tezin İçin <span className="text-blue-600">Kredi</span> Satın Al
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Sadece kullandığın kadar öde. Abonelik yok, aylık ücret yok.
            Krediler asla sona ermez.
          </p>

          {/* Mevcut Kredi Bakiyesi */}
          {user && (
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300 rounded-full px-6 py-3 shadow-sm">
              <Coins className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg text-blue-800">
                Bakiyeniz: <strong className="text-2xl">{creditsLoading ? '...' : currentCredits}</strong> kredi
              </span>
            </div>
          )}
        </div>

        {/* Kredi Paketleri */}
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
                    En İyi Değer
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Paket Başlığı */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>

                  {/* Fiyat */}
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">₺{pkg.priceUsd}</span>
                  </div>

                  {/* Krediler */}
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

                  {/* Kredi Başı Fiyat */}
                  <p className="text-sm text-gray-500 mt-2">
                    Kredi başı ₺{pkg.pricePerCredit.toFixed(2)}
                  </p>
                </div>

                {/* Ne yapabilirsin */}
                <div className="space-y-2 mb-6 text-sm">
                  <p className="font-medium text-gray-700">{pkg.totalCredits} kredi ile:</p>
                  <div className="text-gray-600 space-y-1">
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} tez analizi</p>
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} özet oluşturma</p>
                    <p>• ~{pkg.totalCredits} kaynak formatlama</p>
                  </div>
                </div>

                {/* Satın Al Butonu */}
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

        {/* Kredi Maliyetleri Tablosu */}
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

        {/* Ücretsiz Kredi Bölümü */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 text-center">
            <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Yeni Kullanıcılara 10 Ücretsiz Kredi!
            </h2>
            <p className="text-gray-600 mb-6">
              Hemen kayıt ol ve tez analizi araçlarımızı denemek için 10 kredi kazan.
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

        {/* SSS Bölümü */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Sık Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Krediler sona erer mi?</h3>
              <p className="text-gray-600">Hayır, kredileriniz asla sona ermez. İhtiyaç duyduğunuzda kullanın.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">İade alabilir miyim?</h3>
              <p className="text-gray-600">Teknik bir sorun nedeniyle analiz başarısız olursa, krediler otomatik olarak hesabınıza iade edilir.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Ödeme güvenli mi?</h3>
              <p className="text-gray-600">Tüm ödemeler SSL şifrelemeli ve Iyzico&apos;nun PCI DSS uyumlu altyapısı üzerinden işlenir.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Neden abonelik yerine kredi sistemi?</h3>
              <p className="text-gray-600">Tez yazımı aylık bir aktivite değil. Kredi sistemiyle yalnızca kullandığınız kadar ödersiniz, tekrarlayan ücretler konusunda endişelenmenize gerek kalmaz.</p>
            </div>
          </div>
        </div>

        {/* Güven Göstergeleri */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">SSL Güvenliği</span>
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
