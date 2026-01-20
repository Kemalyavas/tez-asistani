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
    name: 'Citation Formatting', 
    credits: CREDIT_COSTS.citation_format.creditsRequired, 
    description: 'APA, MLA, Chicago, etc.' 
  },
  { 
    name: 'Abstract Generation', 
    credits: CREDIT_COSTS.abstract_generate.creditsRequired, 
    description: 'TR, EN or Both' 
  },
  { 
    name: 'Thesis Analysis (Short)', 
    credits: CREDIT_COSTS.thesis_basic.creditsRequired, 
    description: 'Up to 30 pages' 
  },
  { 
    name: 'Thesis Analysis (Medium)', 
    credits: CREDIT_COSTS.thesis_standard.creditsRequired, 
    description: '31-70 pages' 
  },
  { 
    name: 'Thesis Analysis (Long)', 
    credits: CREDIT_COSTS.thesis_comprehensive.creditsRequired, 
    description: '71+ pages with RAG' 
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
      toast.error('Please sign in first')
      router.push('/auth')
      return
    }

    if (packageId === 'free') {
      toast.success('New users receive 10 free credits!')
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
        throw new Error(data.error || 'Payment could not be initiated')
      }

      // Redirect to Iyzico Checkout
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Buy <span className="text-blue-600">Credits</span> for Your Thesis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Pay only for what you use. No subscriptions, no monthly fees.
            Credits never expire.
          </p>

          {/* Current Credit Balance */}
          {user && (
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300 rounded-full px-6 py-3 shadow-sm">
              <Coins className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg text-blue-800">
                Your Balance: <strong className="text-2xl">{creditsLoading ? '...' : currentCredits}</strong> credits
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
                    Best Value
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
                  </div>
                  
                  {/* Credits */}
                  <div className="bg-blue-50 rounded-lg py-3 px-4">
                    <div className="flex items-center justify-center">
                      <Coins className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-2xl font-bold text-blue-600">{pkg.credits}</span>
                      <span className="text-blue-600 ml-1">credits</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="flex items-center justify-center mt-1 text-green-600 text-sm">
                        <Gift className="h-4 w-4 mr-1" />
                        +{pkg.bonusCredits} bonus credits!
                      </div>
                    )}
                  </div>
                  
                  {/* Per Credit Price */}
                  <p className="text-sm text-gray-500 mt-2">
                    ${(pkg.priceUsd / pkg.totalCredits).toFixed(2)} per credit
                  </p>
                </div>

                {/* What you can do */}
                <div className="space-y-2 mb-6 text-sm">
                  <p className="font-medium text-gray-700">With {pkg.totalCredits} credits:</p>
                  <div className="text-gray-600 space-y-1">
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} medium thesis analyses</p>
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} abstract generations</p>
                    <p>• ~{pkg.totalCredits} citation formats</p>
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Buy Now
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
            Credit Costs
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Credits</th>
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
              New Users Get 10 Free Credits!
            </h2>
            <p className="text-gray-600 mb-6">
              Sign up now and get 10 credits to try our thesis analysis tools. 
              No credit card required.
            </p>
            {!user && (
              <button
                onClick={() => router.push('/auth')}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Sign Up Free
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Do credits expire?</h3>
              <p className="text-gray-600">No, your credits never expire. Use them whenever you need.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">If analysis fails due to a technical issue, credits are automatically refunded to your account.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Is payment secure?</h3>
              <p className="text-gray-600">All payments are SSL encrypted and processed via Iyzico's PCI DSS-compliant infrastructure.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Why credit-based instead of subscription?</h3>
              <p className="text-gray-600">Thesis writing isn't a monthly activity. With credits, you pay only for what you use without worrying about recurring charges.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
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
