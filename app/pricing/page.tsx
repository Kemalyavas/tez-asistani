'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins, Sparkles, Zap, Gift, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'
import Script from 'next/script'
import { structuredData } from '../lib/structuredData'
import { CREDIT_PACKAGES, CREDIT_COSTS } from '../lib/pricing'
import { useCredits } from '../hooks/useCredits'

const CREDIT_ACTIONS = [
  { name: 'Atıf Biçimlendirme', credits: CREDIT_COSTS.citation_format.creditsRequired, description: 'APA, MLA, Chicago, IEEE' },
  { name: 'Özet Oluşturma', credits: CREDIT_COSTS.abstract_generate.creditsRequired, description: 'Türkçe, İngilizce veya Her İkisi' },
  { name: 'Tez Analizi (Temel)', credits: CREDIT_COSTS.thesis_basic.creditsRequired, description: '1 – 50 sayfa' },
  { name: 'Tez Analizi (Standart)', credits: CREDIT_COSTS.thesis_standard.creditsRequired, description: '51 – 100 sayfa' },
  { name: 'Tez Analizi (Kapsamlı)', credits: CREDIT_COSTS.thesis_comprehensive.creditsRequired, description: '100+ sayfa' },
]

const FAQS = [
  { q: 'Krediler sona erer mi?', a: 'Hayır, kredilerin asla sona ermez. İhtiyaç duyduğunda kullan.' },
  { q: 'İade alabilir miyim?', a: 'Teknik bir sorun nedeniyle analiz başarısız olursa, krediler otomatik olarak hesabına iade edilir.' },
  { q: 'Ödeme güvenli mi?', a: 'Tüm ödemeler SSL şifrelemeli ve Iyzico’nun PCI DSS uyumlu altyapısı üzerinden işlenir.' },
  { q: 'Neden abonelik yerine kredi sistemi?', a: 'Tez yazımı aylık bir aktivite değil. Kredi sistemiyle yalnızca kullandığın kadar ödersin, tekrarlayan ücretler konusunda endişelenmezsin.' },
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
    setLoading(packageId)
    try {
      const response = await fetch('/api/iyzico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, user_id: user.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ödeme başlatılamadı')
      window.location.href = data.url
    } catch (error: any) {
      toast.error(error.message || 'Ödeme başlatılamadı')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper-cool">
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

      <div className="max-w-6xl mx-auto px-6 py-14 md:py-[72px]">
        {/* Başlık */}
        <div className="reveal text-center max-w-2xl mx-auto mb-8">
          <h1 className="font-serif font-medium text-4xl md:text-[46px] leading-[1.06] tracking-[-0.02em] mb-4">
            Tezin için <span className="italic text-primary-700">kredi</span> satın al
          </h1>
          <p className="text-lg leading-relaxed text-ink/60 mb-5">
            Sadece kullandığın kadar öde. Abonelik yok, aylık ücret yok. Kredilerin asla sona ermez.
          </p>
          {user && (
            <div className="inline-flex items-center gap-2 bg-white border border-line-cool rounded-full px-4 py-2.5 shadow-[0_10px_24px_-18px_rgba(20,28,55,0.4)]">
              <Coins className="h-4 w-4 text-primary-700" />
              <span className="text-[15px] text-ink/60">
                Bakiyeniz: <strong className="font-serif text-xl font-semibold text-ink">{creditsLoading ? '…' : currentCredits}</strong> kredi
              </span>
            </div>
          )}
        </div>

        {/* Değer önerisi */}
        <div className="reveal max-w-2xl mx-auto mb-10 bg-primary-50 border border-primary-100 rounded-2xl p-6 flex items-start gap-4">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-700" />
          </span>
          <div>
            <h3 className="text-base font-bold text-primary-800 mb-1.5">En iyi sonuç için birden fazla analiz turu</h3>
            <p className="text-sm leading-relaxed text-ink/70">
              Tezini analiz et, raporun önerdiği düzeltmeleri yap, sonra tekrar analiz et. Her turda tezin jüri ve YÖK
              standartlarına biraz daha yaklaşır. Tek seferlik kontrolden çok, revizyon döngüsü için kredi planlamak
              çoğu tez yazarına daha iyi sonuç verir.
            </p>
          </div>
        </div>

        {/* Paketler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] items-stretch mb-14">
          {Object.values(CREDIT_PACKAGES).map((pkg) => {
            const pop = pkg.popular
            return (
              <div
                key={pkg.id}
                className={`reveal relative flex flex-col rounded-2xl border-[1.5px] p-6 ${
                  pop
                    ? 'border-[#14224f] bg-gradient-to-br from-[#14224f] to-[#2a52a8] shadow-[0_32px_60px_-30px_rgba(20,34,79,0.55)]'
                    : 'border-line-cool bg-white shadow-[0_16px_36px_-30px_rgba(20,28,55,0.35)]'
                }`}
              >
                {pop && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-white text-primary-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-[0_8px_18px_-6px_rgba(20,28,55,0.5)] whitespace-nowrap">
                    <Sparkles className="h-3 w-3" /> En İyi Değer
                  </span>
                )}
                <div className="text-center mb-4">
                  <h3 className={`text-base font-bold mb-3.5 ${pop ? 'text-[#c6d1ec]' : 'text-ink/60'}`}>{pkg.name}</h3>
                  <div className={`font-serif text-[40px] font-semibold leading-none mb-3.5 ${pop ? 'text-white' : 'text-ink'}`}>₺{pkg.priceUsd}</div>
                  <div className={`rounded-xl py-3 ${pop ? 'bg-white/10' : 'bg-primary-50'}`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Coins className={`h-[18px] w-[18px] ${pop ? 'text-[#eef2fb]' : 'text-primary-700'}`} />
                      <span className={`text-[22px] font-extrabold ${pop ? 'text-[#eef2fb]' : 'text-primary-700'}`}>{pkg.credits}</span>
                      <span className={`text-sm ${pop ? 'text-[#eef2fb]' : 'text-primary-700'}`}>kredi</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className={`flex items-center justify-center gap-1 mt-1.5 text-[12.5px] font-bold ${pop ? 'text-[#9db8f0]' : 'text-green-700'}`}>
                        <Gift className="h-3 w-3" /> +{pkg.bonusCredits} bonus kredi!
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-5 flex-1">
                  <p className={`text-[13px] font-bold mb-2 ${pop ? 'text-[#d7deee]' : 'text-ink/70'}`}>{pkg.totalCredits} kredi ile:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      `~${Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_comprehensive.creditsRequired)} uzun tez analizi`,
                      `~${Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} özet oluşturma`,
                      `~${pkg.totalCredits} kaynak formatlama`,
                    ].map((perk) => (
                      <div key={perk} className={`flex items-center gap-2 text-[13.5px] ${pop ? 'text-[#c2cbe6]' : 'text-ink/60'}`}>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${pop ? 'text-[#9db8f0]' : 'text-primary-700'}`} strokeWidth={2.6} />
                        {perk}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handlePackageSelect(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full inline-flex items-center justify-center gap-2 text-[14.5px] font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                    pop ? 'bg-white text-[#14224f] hover:opacity-95' : 'bg-ink text-white hover:opacity-90'
                  }`}
                >
                  {loading === pkg.id ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> İşleniyor…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Satın Al</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Kredi maliyetleri */}
        <div className="reveal max-w-2xl mx-auto mb-14">
          <h2 className="font-serif font-medium text-3xl tracking-[-0.015em] text-center mb-6">Kredi maliyetleri</h2>
          <div className="bg-white border border-line-cool rounded-2xl shadow-[0_18px_44px_-34px_rgba(20,28,55,0.4)] overflow-hidden">
            {CREDIT_ACTIONS.map((action, i) => (
              <div key={i} className={`flex items-center justify-between gap-4 px-6 py-4 ${i < CREDIT_ACTIONS.length - 1 ? 'border-b border-line-cool/70' : ''}`}>
                <div>
                  <div className="text-[15px] font-bold text-ink">{action.name}</div>
                  <div className="text-[13px] text-ink/50 mt-0.5">{action.description}</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 bg-primary-50 text-primary-800 text-sm font-bold px-3 py-1.5 rounded-full">
                  <Coins className="h-3.5 w-3.5" /> {action.credits}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ücretsiz kredi */}
        <div className="reveal max-w-2xl mx-auto mb-14 relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(20,34,79,0.7)] bg-gradient-to-br from-[#16265c] via-[#1e3a8a] to-[#2f54a6] p-10 text-center">
          <div className="absolute -top-20 -right-14 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex w-13 h-13 p-3.5 rounded-2xl bg-white/12 mb-4">
              <Gift className="h-6 w-6 text-[#9db8f0]" />
            </span>
            <h2 className="font-serif font-medium text-[30px] tracking-[-0.015em] text-white mb-3">Yeni kullanıcılara 10 ücretsiz kredi</h2>
            <p className="text-base leading-relaxed text-primary-100 mb-6">
              Hemen kayıt ol ve tez analizi araçlarını denemek için 10 kredi kazan. Kredi kartı gerekmez.
            </p>
            {!user && (
              <Link href="/auth?mode=signup" className="inline-block bg-white text-[#14224f] text-[15px] font-bold px-7 py-3.5 rounded-xl hover:-translate-y-0.5 transition-transform">
                Ücretsiz Kayıt Ol
              </Link>
            )}
          </div>
        </div>

        {/* SSS */}
        <div className="reveal max-w-2xl mx-auto mb-12">
          <h2 className="font-serif font-medium text-3xl tracking-[-0.015em] text-center mb-6">Sık sorulan sorular</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => (
              <div key={i} className="bg-white border border-line-cool rounded-xl p-5">
                <h3 className="text-base font-bold text-ink mb-1.5">{f.q}</h3>
                <p className="text-[14.5px] leading-relaxed text-ink/60">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Güven */}
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {['SSL Güvenliği', '256-bit Şifreleme', 'PCI DSS Uyumlu', 'KVKK Uyumlu'].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[13.5px] font-semibold text-ink/50">
              <Check className="h-4 w-4 text-green-700" strokeWidth={2.4} /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
