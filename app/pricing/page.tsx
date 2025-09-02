'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '0',
    period: 'süresiz',
    description: 'Denemek için ideal',
    features: [
      '1 tez analizi',
      '1 özet oluşturma',
      '5 kaynak formatlama',
      'Temel AI desteği',
      'Topluluk forumları'
    ],
    limitations: [
      'Sınırlı kullanım',
      'Öncelikli destek',
      'Gelişmiş AI modelleri',
      'Premium özellikler'
    ],
    buttonText: 'Ücretsiz Başla',
    popular: false,
    disabled: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '199',
    period: 'aylık',
    description: 'Akademisyenler ve öğrenciler için',
    features: [
      '50 tez analizi',
      '20 özet oluşturma',
      '100 kaynak formatlama',
      'Gelişmiş AI modelleri',
      'Hızlı e-posta desteği',
      'Detaylı kullanım raporları',
      'Çoklu format desteği (APA, MLA, Chicago, IEEE)'
    ],
    limitations: [],
    buttonText: 'Pro\'yu Seç',
    popular: true,
    disabled: false
  },
  {
    id: 'expert',
    name: 'Expert',
    price: '499',
    period: 'aylık',
    description: 'Kapsamlı kullanım için',
    features: [
      'Sınırsız tez analizi',
      'Sınırsız özet oluşturma',
      'Sınırsız kaynak formatlama',
      'En gelişmiş AI modelleri',
      'Türkçe ve İngilizce özet desteği',
      '7/24 öncelikli destek',
      'Özel kullanıcı yönetimi',
      'Detaylı analitik raporlar'
    ],
    limitations: [],
    buttonText: 'Expert\'i Seç',
    popular: false,
    disabled: false
  }
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [discountCode, setDiscountCode] = useState<string>('')
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single()
        setUserProfile(profile)
      }
    }
    getUser()
  }, [])

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      toast.error('Lütfen önce giriş yapın')
      router.push('/auth')
      return
    }

    if (userProfile?.subscription_status === 'premium') {
      toast.error('Zaten premium üyeliğiniz var. Tekrar üyelik alamazsınız.')
      return
    }

    if (planId === 'free') return
    
    // Pro plan seçildiğinde indirim kodu giriş alanını göster
    if (planId === 'pro' && !showDiscountInput) {
      setShowDiscountInput(true)
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/iyzico/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          user_id: user.id,
          billing_cycle: billingCycle,
          discountCode: planId === 'pro' ? discountCode : '' // Sadece Pro plan için indirim kodu gönder
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ödeme işlemi başlatılamadı')
      }

      // İyzico Checkout'a yönlendir
      window.location.href = data.url

    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Ödeme işlemi başlatılamadı')
    } finally {
      setLoading(null)
      setShowDiscountInput(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Size Uygun <span className="text-blue-600">Planı</span> Seçin
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Tez yazım sürecinizi hızlandıracak profesyonel araçlara erişin. 
            İstediğiniz zaman iptal edebilirsiniz.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
              Aylık
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-gray-500'}`}>
              Yıllık
              <span className="ml-1 text-xs text-green-600 font-semibold">%20 İndirim</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    En Popüler
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}₺</span>
                    {plan.price !== '0' && (
                      <span className="text-gray-500 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.price !== '0' && (
                    <p className="text-sm text-green-600 mt-2">
                      Yıllık ödeme: {Math.floor(parseInt(plan.price) * 12 * 0.8)}₺ ({Math.floor(parseInt(plan.price) * 12 * 0.2)}₺ tasarruf)
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start opacity-60">
                      <X className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* Discount Code Input - Only show for Pro plan when activated */}
                {plan.id === 'pro' && showDiscountInput && (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="İndirim kodu girin"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {discountCode === 'bedo10' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          %10 indirim
                        </div>
                      )}
                    </div>
                    {discountCode === 'bedo10' && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        %10 indirim uygulandı: {parseInt(plan.price) * 0.9}₺ 
                        {billingCycle === 'yearly' && ` (Yıllık: ${Math.floor(parseInt(plan.price) * 12 * 0.8 * 0.9)}₺)`}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={plan.disabled || loading === plan.id}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : plan.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </span>
                  ) : (
                    plan.id === 'pro' && showDiscountInput ? 'Devam Et' : plan.buttonText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Sıkça Sorulan Sorular</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">İstediğim zaman iptal edebilir miyim?</h3>
              <p className="text-gray-600">Evet, istediğiniz zaman iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna kadar hizmetlerinizi kullanmaya devam edebilirsiniz.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Ödeme güvenli mi?</h3>
              <p className="text-gray-600">Tüm ödemelerimiz SSL şifreli ve PCI DSS standartlarında güvenli İyzico altyapısı üzerinden işlenmektedir.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Fatura alabilir miyim?</h3>
              <p className="text-gray-600">Evet, tüm ödemeleriniz için e-fatura otomatik olarak düzenlenir ve email adresinize gönderilir.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 opacity-60">
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
