'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FileUploader from './components/FileUploader';
import ResultDisplay from './components/ResultDisplay';
import CitationFormatter from './components/CitationFormatter';
import AbstractGenerator from './components/AbstractGenerator';
import TestimonialsCarousel from './components/TestimonialsCarousel';
import { Zap, CheckCircle, BookOpen, FileSearch, Check, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
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
  
  // Scroll için ref'ler
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const mainAppRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Scroll fonksiyonları
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
    { icon: <FileSearch className="h-6 w-6" />, title: 'Format Kontrolü', desc: 'YÖK standartlarına uygunluk' },
    { icon: <BookOpen className="h-6 w-6" />, title: 'Kaynak Düzenleme', desc: 'APA, MLA, Chicago formatları' },
    { icon: <Zap className="h-6 w-6" />, title: 'Özet Oluşturma', desc: 'AI destekli özet ve abstract' },
    { icon: <CheckCircle className="h-6 w-6" />, title: 'Hızlı Analiz', desc: 'Saniyeler içinde sonuç' },
  ];

  // Fiyatlandırma planları
  const plans = [
    {
      id: 'free',
      name: 'Ücretsiz',
      price: 0,
      description: 'Denemek için ideal',
      features: [
        '1 tez analizi',
        '1 özet oluşturma',
        '5 kaynak formatlama',
        'Temel AI desteği',
        'Topluluk forumları',
      ],
      notIncluded: [
        'Sınırsız kullanım',
        'Öncelikli destek',
        'Gelişmiş AI modelleri',
        'Premium özellikler',
      ],
      cta: 'Ücretsiz Başla',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: isHydrated ? (billingPeriod === 'monthly' ? 199 : 1912) : 199, // Yıllık indirimli fiyat
      
      description: 'Akademisyenler ve Öğrenciler için',
      features: [
        '50 tez analizi',
        '20 özet oluşturma',
        '100 kaynak formatlama',
        'Gelişmiş AI modelleri',
        'Hızlı e-posta desteği',
        'Detaylı kullanım raporları',
        'Çoklu format desteği (APA, MLA, Chicago, IEEE)',
      ],
      notIncluded: [
        'Sınırsız kullanım',
        '7/24 özel destek',
        'API erişimi',
      ],
      cta: 'Pro\'yu Seç',
      popular: true,
    },
    {
      id: 'expert',
      name: 'Expert',
      price: isHydrated ? (billingPeriod === 'monthly' ? 499 : 4790) : 499, // Yıllık indirimli fiyat
      description: 'Sınırsız kullanım için',
      features: [
        'Sınırsız tez analizi',
        'Sınırsız özet oluşturma',
        'Sınırsız kaynak formatlama',
        'En gelişmiş AI modelleri',
        'Türkçe ve İngilizce özet desteği',
        '7/24 öncelikli destek',
        'Özel kullanıcı yönetimi',
        'Detaylı analitik raporlar',
      ],
      notIncluded: [],
      cta: 'Expert\'i Seç',
      popular: false,
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      scrollToApp();
      toast.success('Ücretsiz denemeniz başladı! 1 analiz hakkınız var.');
      return;
    }

    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      router.push('/auth');
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/iyzico/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- DEĞİŞİKLİK: user_id ARTIK GÖNDERİLMİYOR ---
        body: JSON.stringify({
          plan: planId,
          billing_cycle: billingPeriod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ödeme işlemi başlatılamadı');
      }
      
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Ödeme işlemi başlatılamadı');
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
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4 animate-bounce-gentle">
                🎓 YÖK Standartlarında
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Tez Yazımını <br/>
              <span className="text-gradient animate-slide-in">Kolaylaştırıyoruz</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              YÖK formatında hatasız tez yazımı için AI destekli asistanınız. 
              <span className="text-blue-600 font-semibold"> Profesyonel sonuçlar, dakikalar içinde.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-slide-in">
              <button 
                onClick={scrollToApp}
                className="btn-primary text-lg px-8 py-4 min-w-[200px]"
              >
                Ücretsiz Dene
              </button>
              <button 
                onClick={scrollToHowItWorks}
                className="btn-secondary text-lg px-8 py-4 min-w-[200px]"
              >
                📖 Nasıl Çalışır?
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-12 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Analiz Edilen Tez</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600">Doğruluk Oranı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">2 Dakika</div>
                <div className="text-gray-600">Ortalama Süre</div>
              </div>
            </div>
            
            {/* Güvenlik Garantisi */}
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-800">%100 Güvenli ve Gizli</h3>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Tez dosyalarınız SSL şifreleme ile korunur, analiz sonrası otomatik silinir ve hiçbir zaman 
                  üçüncü taraflarla paylaşılmaz. <button 
                    onClick={() => document.getElementById('privacy-policy')?.scrollIntoView({ behavior: 'smooth' })}
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer underline"
                  >
                    Gizlilik Politikası →
                  </button>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>SSL Güvenlik</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Auto Delete</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>KVKK Uyumlu</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Zero Share</span>
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
            <h2 className="text-4xl font-bold mb-4">Tez Yazımınızı <span className="text-gradient">Güçlendirin</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern AI teknolojisi ile akademik standartlarda tez hazırlama sürecinizi hızlandırın
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
            <h2 className="text-4xl font-bold mb-4">Nasıl <span className="text-gradient">Çalışır?</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              3 basit adımda tezinizi analiz edin ve profesyonel sonuçlar alın
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              
              <div className="text-center group animate-slide-in">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">📄 Tezi Yükle</h3>
                <p className="text-gray-600 leading-relaxed">
                  PDF veya DOCX formatında tez dosyanızı güvenli sistemimize yükleyin. 
                  <span className="text-blue-600 font-semibold">Otomatik format algılama</span> ile hızlıca başlayın.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-200">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 no-decoration">🤖 AI Analizi</h3>
                <p className="text-gray-600 leading-relaxed">
                  Gelişmiş yapay zeka teknolojisi tezinizi <span className="text-purple-600 font-semibold">YÖK standartlarına</span> göre 
                  detaylı analiz eder ve format kontrolü yapar.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-400">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Rapor Al</h3>
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
                Ücretsiz Dene!
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section id="app" ref={mainAppRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Tez <span className="text-gradient">Asistanınız</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Profesyonel tez hazırlama araçlarını ücretsiz deneyin
            </p>
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
                📄 Tez Yükle
              </button>
              <button
                onClick={() => setActiveTab('citation')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'citation' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                📚 Kaynak Formatla
              </button>
              <button
                onClick={() => setActiveTab('abstract')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'abstract' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                ✨ Özet Oluştur
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                {activeTab === 'upload' && (
                  <div className="animate-fade-in">
                    <FileUploader onAnalysisComplete={setAnalysisResult} />
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
            
            {/* Result Display */}
            {analysisResult && activeTab === 'upload' && (
              <div className="mt-8 animate-fade-in">
                <ResultDisplay result={analysisResult} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING SECTION - GÜNCELLENMİŞ BUTONLAR */}
      <section id="pricing" ref={pricingRef} className="py-24 gradient-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              Basit ve Şeffaf <span className="text-gradient">Fiyatlandırma</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Size uygun planı seçin, istediğiniz zaman iptal edin.</p>

            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md transition font-medium ${
                  billingPeriod === 'monthly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md transition font-medium ${
                  billingPeriod === 'yearly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  2 ay ücretsiz
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : 'hover:shadow-2xl transition-shadow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      En Popüler
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <div className="text-4xl font-bold">
                      {plan.price === 0 ? '0₺' : `${plan.price}₺`}
                      <span className="text-lg text-gray-500 font-normal">
                        /{billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <li key={idx} className="flex items-start opacity-50">
                      <X className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 line-through text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)} // plan.name yerine plan.id kullandık
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' : 
                    plan.id === 'free' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Yönlendiriliyor...' : plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Kullanıcılarımız Ne Diyor?
          </h2>
          
          <TestimonialsCarousel />
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
                  Ücretsiz deneme için kredi kartı gerekli mi?
                </h3>
                <p className="text-gray-600">
                  Hayır, ücretsiz planı kullanmak için kredi kartı gerekmez. 
                  1 tez analizi hakkınızı hemen kullanabilirsiniz.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Pro plan'daki 50 analiz hakkı yeterli mi?
                </h3>
                <p className="text-gray-600">
                  Çoğu öğrenci için ayda 50 analiz fazlasıyla yeterli. 
                  Ortalama bir tez yazım sürecinde 10-20 analiz kullanılıyor.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Expert plan'ın farkı nedir?
                </h3>
                <p className="text-gray-600">
                  Expert plan sınırsız kullanım, özel raporlar ve API erişimi sunar. 
                  Akademisyenler ve yoğun kullanıcılar için idealdir.
                </p>
              </div>

              <div id="privacy-policy" className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-green-800 flex items-center">
                  🔒 Tezim güvende mi? Gizliliğim korunuyor mu?
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>%100 güvenli ve gizli!</strong> Yüklediğiniz tez dosyaları:
                </p>
                <ul className="text-gray-600 space-y-1 mb-3">
                  <li>• Hiçbir zaman başka kullanıcılarla paylaşılmaz</li>
                  <li>• Analiz sonrası otomatik olarak silinir</li>
                  <li>• AI eğitiminde kullanılmaz</li>
                  <li>• SSL şifreleme ile korunur</li>
                </ul>
                <p className="text-sm text-gray-600">
                  Detaylı bilgi için <a href="/privacy-policy" className="text-blue-600 hover:underline font-medium">Veri Gizliliği Politikamızı</a> inceleyebilirsiniz.
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
            Tez Yazımına Bugün Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz analiz hakkınızı hemen kullanın
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