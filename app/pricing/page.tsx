'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

import { PRICE_CONFIG, getFormattedPrice, getYearlySavings } from '../lib/pricing';
import Script from 'next/script'
import { structuredData } from '../lib/structuredData'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Ideal for trying out',
    features: [
      '1 thesis analysis',
      '1 abstract generation',
      '5 citation formattings',
      'Basic AI support',
      'Community forums'
    ],
    limitations: [
      'Limited usage',
      'Priority support',
      'Advanced AI models',
      'Premium features'
    ],
    buttonText: 'Start Free',
    popular: false,
    disabled: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: getFormattedPrice('pro', 'monthly'),
    period: 'monthly',
    description: 'For academics and students',
    features: PRICE_CONFIG.pro.features,
    limitations: [],
    buttonText: 'Choose Pro',
    popular: true,
    disabled: false
  },
  {
    id: 'expert',
    name: 'Expert',
    price: getFormattedPrice('expert', 'monthly'),
    period: 'monthly',
    description: 'For comprehensive usage',
    features: PRICE_CONFIG.expert.features,
    limitations: [],
    buttonText: 'Choose Expert',
    popular: false,
    disabled: false
  }
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
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
      toast.error('Please sign in first')
      router.push('/auth')
      return
    }

    if (userProfile?.subscription_status === 'premium') {
      toast.error('You already have a premium subscription.')
      return
    }

    if (planId === 'free') return

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
          billing_cycle: billingCycle
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment could not be initiated')
      }

      // İyzico Checkout'a yönlendir
      window.location.href = data.url

    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Payment could not be initiated')
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
              { name: 'Home', url: 'https://www.tezai.com.tr' },
              { name: 'Pricing', url: 'https://www.tezai.com.tr/pricing' },
            ])
          ),
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose the <span className="text-blue-600">Right Plan</span> for You
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Access professional tools to accelerate your thesis writing process.
            Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-gray-500'}`}>
              Yearly
              <span className="ml-1 text-xs text-green-600 font-semibold">20% Off</span>
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
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    {plan.price !== '0' && (
                      <span className="text-gray-500 ml-2">/month</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.price !== '0' && (
                    <p className="text-sm text-green-600 mt-2">
                      Yearly payment: ${plan.id !== 'free' ? PRICE_CONFIG[plan.id as 'pro' | 'expert'].yearly : 0} (Save ${plan.id !== 'free' ? getYearlySavings(plan.id) : 0})
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
                      Processing...
                    </span>
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel anytime. After cancellation, you can continue using the service until the end of the current period.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is payment secure?</h3>
              <p className="text-gray-600">All payments are SSL encrypted and processed via Iyzico’s PCI DSS-compliant infrastructure.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I get an invoice?</h3>
              <p className="text-gray-600">Yes, an e-invoice is automatically issued for all payments and sent to your email address.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">SSL Security</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">256-bit Encryption</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">PCI DSS Compliant</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">KVKK Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
