'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FileUploader from './components/FileUploader';
import CitationFormatter from './components/CitationFormatter';
import AbstractGenerator from './components/AbstractGenerator';

import { Zap, CheckCircle, BookOpen, FileSearch, Check, Coins, Gift, Sparkles } from 'lucide-react';
import { CREDIT_PACKAGES, CREDIT_COSTS } from './lib/pricing';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  
    useEffect(() => {
    setIsHydrated(true);
    
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
   
  }, [supabase]);
  
  // Scroll refs
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const mainAppRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Scroll helpers
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToApp = () => {
    mainAppRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: <FileSearch className="h-6 w-6" />, title: 'Format kontrolleri', desc: 'Akademik standartlara göre doğrulama' },
    { icon: <BookOpen className="h-6 w-6" />, title: 'Kaynakça', desc: 'Tek tıkla APA, MLA veya Chicago' },
    { icon: <Zap className="h-6 w-6" />, title: 'Özetler', desc: 'Düzenleyebileceğiniz net, özlü özetler' },
    { icon: <CheckCircle className="h-6 w-6" />, title: 'Hızlı sonuçlar', desc: 'Sorunları saatler değil saniyeler içinde görün' },
  ];

  // Credit cost info for display
  const creditCostInfo = [
    { action: 'Kaynak Formatlama', credits: CREDIT_COSTS.citation_format.creditsRequired, note: 'APA, MLA, Chicago, IEEE' },
    { action: 'Özet Oluşturma', credits: CREDIT_COSTS.abstract_generate.creditsRequired, note: 'Türkçe, İngilizce veya Her İkisi' },
    { action: 'Tez Analizi (1-50 sayfa)', credits: CREDIT_COSTS.thesis_basic.creditsRequired, note: 'Temel' },
    { action: 'Tez Analizi (51-100 sayfa)', credits: CREDIT_COSTS.thesis_standard.creditsRequired, note: 'Standart' },
    { action: 'Tez Analizi (100+ sayfa)', credits: CREDIT_COSTS.thesis_comprehensive.creditsRequired, note: 'Kapsamlı' },
  ];

  const handleSelectPackage = async (packageId: string) => {

    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      router.push('/auth');
      return;
    }

    setLoadingPlan(packageId);

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ödeme başlatılamadı');
      }
      
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Ödeme başlatılamadı');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-24 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gurur duyacağın bir tez yaz
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              TezAI format hatalarını gösterir, kaynakçayı düzeltir ve özetlerinizi iyileştirmenize yardımcı olur — siz araştırmaya odaklanın.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-slide-in">
              <button 
                onClick={scrollToApp}
                className="btn-primary text-lg px-8 py-4 min-w-[200px]"
                aria-label="TezAI araçlarını ücretsiz dene"
              >
                Ücretsiz dene
              </button>
              <button 
                onClick={scrollToHowItWorks}
                className="btn-secondary text-lg px-8 py-4 min-w-[200px]"
              >
                Nasıl çalışır
              </button>
            </div>
            
            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-12 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Yapay Zeka</div>
                <div className="text-gray-600">Tez Analizi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10 Ücretsiz</div>
                <div className="text-gray-600">Başlangıç Kredisi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">Hızlı</div>
                <div className="text-gray-600">Dakikalar İçinde Sonuç</div>
              </div>
            </div>
            
            {/* Security Guarantee */}
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-800">Güvenli ve gizli</h3>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Tez dosyalarınız SSL şifreleme ile korunur, analiz sonrası otomatik silinir ve asla üçüncü taraflarla paylaşılmaz. <button
                    onClick={() => document.getElementById('privacy-policy')?.scrollIntoView({ behavior: 'smooth' })}
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer underline"
                  >
                    Gizlilik Politikası
                  </button>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>SSL Güvenlik</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Otomatik Silme</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>KVKK Uyumlu</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Sıfır Paylaşım</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Daha hızlı çalış, daha az hata yap</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Belirsiz {'"'}yapay zeka sihri{'"'} yerine somut kontroller ve öneriler.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center group">
                <div className="text-blue-600 flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" ref={howItWorksRef} className="py-24 gradient-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Nasıl çalışır</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Üç adımda yardım al.</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              
              <div className="text-center group animate-slide-in">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Tezini yükle</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tez dosyanı PDF veya DOCX formatında güvenli sistemimize yükle.
                  <span className="text-blue-600 font-semibold"> Otomatik format algılama</span> ile hızlıca başla.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-200">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 no-decoration">Yapay Zeka ile İncele</h3>
                <p className="text-gray-600 leading-relaxed">
                  Gelişmiş yapay zeka teknolojisi tezinizi <span className="text-purple-600 font-semibold">akademik standartlara</span>
                  göre detaylı analiz eder ve format kontrolü yapar.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-400">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Raporunu al</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kapsamlı analiz raporu, <span className="text-green-600 font-semibold">düzeltme önerileri</span> ve
                  profesyonel formatlama tavsiyeleri ile tezinizi mükemmelleştirin.
                </p>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="text-center mt-16 animate-fade-in">
              <button 
                onClick={scrollToApp}
                className="btn-primary text-lg px-10 py-4"
              >
                Ücretsiz başla
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section id="app" ref={mainAppRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Tez asistanınız</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Araçlarımızı ücretsiz deneyin.</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {/* Modern Tabs */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-12 bg-gray-100 rounded-2xl p-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'upload' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                Tez Yükle
              </button>
              <button
                onClick={() => setActiveTab('citation')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'citation' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                Kaynak Formatla
              </button>
              <button
                onClick={() => setActiveTab('abstract')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'abstract' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                Özet Oluştur
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                {activeTab === 'upload' && (
                  <div className="animate-fade-in">
                    <FileUploader />
                  </div>
                )}
                {activeTab === 'citation' && (
                  <div className="animate-fade-in">
                    <CitationFormatter />
                  </div>
                )}
                {activeTab === 'abstract' && (
                  <div className="animate-fade-in">
                    <AbstractGenerator />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* PRICING SECTION - CREDIT-BASED */}
      <section id="pricing" ref={pricingRef} className="py-24 gradient-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              Sadece Kullandığın Kadar <span className="text-gradient">Öde</span>
            </h2>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Abonelik yok. Aylık ücret yok. Krediler asla sona ermez.
            </p>
            <p className="text-sm text-gray-500">
              Yeni kullanıcılar <strong>10 ücretsiz kredi</strong> ile başlar!
            </p>
          </div>

          {/* Credit Packages Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            {Object.values(CREDIT_PACKAGES).map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-xl p-6 ${
                  pkg.popular ? 'ring-2 ring-blue-600 transform scale-105 z-10' : 'hover:shadow-2xl transition-shadow'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" />
                      En Avantajlı
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                  
                  {/* Price */}
                  <div className="text-4xl font-bold mb-2">${pkg.priceUsd}</div>
                  
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
                        +{pkg.bonusCredits} bonus!
                      </div>
                    )}
                  </div>
                  
                  {/* Per Credit Price */}
                  <p className="text-sm text-gray-500 mt-2">
                    ${pkg.pricePerCredit.toFixed(2)} kredi başına
                  </p>
                </div>

                {/* What you can do */}
                <div className="space-y-2 mb-6 text-sm">
                  <p className="font-medium text-gray-700">{pkg.totalCredits} kredi ile:</p>
                  <div className="text-gray-600 space-y-1 text-xs">
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} tez analizi</p>
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} özet</p>
                    <p>• ~{pkg.totalCredits} kaynak formatlama</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPackage(pkg.id)}
                  disabled={loadingPlan === pkg.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loadingPlan === pkg.id ? 'Yönlendiriliyor…' : `${pkg.totalCredits} Kredi Satın Al`}
                </button>
              </div>
            ))}
          </div>

          {/* Credit Cost Table */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-center mb-6">Kredi Maliyetleri</h3>
            <div className="space-y-3">
              {creditCostInfo.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-gray-700">{item.action}</span>
                    {item.note && <span className="text-xs text-gray-400 ml-2">({item.note})</span>}
                  </div>
                  <span className="font-semibold text-blue-600">{item.credits} kredi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Early Access CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              Erken Erişim
            </div>
            <h2 className="text-3xl font-bold mb-4">
              İlk Kullanıcılarımız Arasında Olun
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              TezAI erken erişim aşamasında. Şimdi kaydolun ve <strong>10 ücretsiz kredi</strong> ile
              yapay zeka destekli tez analizini deneyin. Geri bildirimleriniz daha iyi bir araç geliştirmemize yardımcı oluyor.
            </p>
            <button
              onClick={() => router.push('/auth')}
              className="btn-primary text-lg px-8 py-4"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Sıkça Sorulan Sorular
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Başlamak için kredi kartı gerekiyor mu?
                </h3>
                <p className="text-gray-600">
                  Hayır! Kayıt olduğunuzda anında <strong>10 ücretsiz kredi</strong> alırsınız. Bu, tam bir tez analizi veya birden fazla kaynak formatlama ve özet oluşturma için yeterlidir.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Kredilerin süresi doluyor mu?
                </h3>
                <p className="text-gray-600">
                  Hayır, kredilerinizin süresi <strong>asla dolmaz</strong>. Bir kez satın alın, ihtiyacınız olduğunda kullanın. Aylık ücret yok, abonelik yok, baskı yok.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Hangi kredi paketini seçmeliyim?
                </h3>
                <p className="text-gray-600">
                  Tek bir tez için genellikle <strong>Starter</strong> veya <strong>Standart</strong> paketi yeterlidir. Birden fazla projede çalışıyorsanız veya en iyi değeri istiyorsanız, <strong>Pro</strong> paketi bonus ile 600 kredi sunar.
                </p>
              </div>

              <div id="privacy-policy" className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-green-800 flex items-center">
                  🔒 Tezim güvende mi? Gizliliğim korunuyor mu?
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>%100 güvenli ve gizli!</strong> Yüklenen tez dosyalarınız:
                </p>
                <ul className="text-gray-600 space-y-1 mb-3">
                  <li>• Asla diğer kullanıcılarla paylaşılmaz</li>
                  <li>• Analiz sonrası otomatik olarak silinir</li>
                  <li>• Yapay zeka model eğitimi için kullanılmaz</li>
                  <li>• SSL şifreleme ile korunur</li>
                </ul>
                <p className="text-sm text-gray-600">
                  Daha fazla bilgi için <a href="/privacy-policy" className="text-blue-600 hover:underline font-medium">Gizlilik Politikamızı</a> inceleyin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Tezinize Bugün Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz analizinizi hemen kullanın
          </p>
          <button 
            onClick={scrollToApp}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            Ücretsiz Başla
          </button>
        </div>
      </section>
    </main>
  );
}