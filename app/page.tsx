'use client';
import { useState, useRef, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import ResultDisplay from './components/ResultDisplay';
import CitationFormatter from './components/CitationFormatter';
import AbstractGenerator from './components/AbstractGenerator';
import { Zap, CheckCircle, BookOpen, FileSearch, Check, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Hydration tamamlandığında flag'i set et
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
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
      name: 'Ücretsiz',
      price: 0,
      description: 'Denemek için ideal',
      features: [
        '1 tez analizi',
        'Temel format kontrolü',
        '5 kaynak formatlama',
        'Topluluk desteği',
      ],
      notIncluded: [
        'Özet oluşturma',
        'Gelişmiş özellikler',
        'Öncelikli destek',
        'Export özelliği',
      ],
      cta: 'Ücretsiz Başla',
      popular: false,
    },
    {
      name: 'Pro',
      price: isHydrated ? (billingPeriod === 'monthly' ? 10 : 96) : 10, // Yıllık %20 indirim
      
      description: 'Öğrenciler için',
      features: [
        '50 tez analizi',
        'Gelişmiş format kontrolü',
        '50 kaynak formatlama',
        'AI özet oluşturma',
        'Word/PDF export',
        'E-posta desteği',
        'Revizyon önerileri',
      ],
      notIncluded: [
        'Sınırsız kullanım',
        'Özel raporlar',
        'API erişimi',
      ],
      cta: 'Pro\'yu Seç',
      popular: true,
    },
    {
      name: 'Expert',
      price: isHydrated ? (billingPeriod === 'monthly' ? 25 : 240) : 25, // Yıllık %20 indirim
      description: 'Profesyoneller için',
      features: [
        'Sınırsız tez analizi',
        'Gelişmiş format kontrolü',
        'Sınırsız kaynak formatlama',
        'AI özet oluşturma (Türkçe & İngilizce)',
        'Özel analiz raporları',
        'Tez şablonları',
        'Öncelikli destek',
        'Toplu işlem özelliği',
        'Versiyon karşılaştırma',
        'API erişimi',
      ],
      notIncluded: [],
      cta: 'Expert\'i Seç',
      popular: false,
    },
  ];

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Ücretsiz') {
      scrollToApp();
      toast.success('Ücretsiz denemeniz başladı! 1 analiz hakkınız var.');
    } else {
      toast.success(`${planName} planı için ödeme sayfasına yönlendiriliyorsunuz...`);
      // İleride payment integration
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Tez Yazımını <span className="text-blue-600">Kolaylaştırıyoruz</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              YÖK formatında hatasız tez yazımı için AI destekli asistanınız
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={scrollToApp}
                className="btn-primary"
              >
                Ücretsiz Dene
              </button>
              <button 
                onClick={scrollToHowItWorks}
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
              >
                Nasıl Çalışır?
              </button>
            </div>
            
            {/* Güvenlik Garantisi */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🔒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">%100 Güvenli ve Gizli</h3>
                </div>
                <p className="text-gray-600 text-center text-sm">
                  Tez dosyalarınız SSL şifreleme ile korunur, analiz sonrası otomatik silinir ve 
                  hiçbir zaman üçüncü taraflarla paylaşılmaz. 
                  <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1 font-medium">
                    Gizlilik Politikası →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="text-blue-600 flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nasıl <span className="text-blue-600">Çalışır?</span>
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Tezi Yükle</h3>
                <p className="text-gray-600">
                  PDF veya DOCX formatında tez dosyanızı yükleyin
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">AI Analizi</h3>
                <p className="text-gray-600">
                  Yapay zeka tezinizi YÖK standartlarına göre inceler
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Rapor Al</h3>
                <p className="text-gray-600">
                  Detaylı analiz raporu ve düzeltme önerilerini alın
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section ref={mainAppRef} className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  activeTab === 'upload' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Tez Yükle
              </button>
              <button
                onClick={() => setActiveTab('citation')}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  activeTab === 'citation' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Kaynak Formatla
              </button>
              <button
                onClick={() => setActiveTab('abstract')}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  activeTab === 'abstract' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Özet Oluştur
              </button>
            </div>

            {/* Tab Content */}
            <div className="card">
              {activeTab === 'upload' && (
                <FileUploader onAnalysisComplete={setAnalysisResult} />
              )}
              {activeTab === 'citation' && <CitationFormatter />}
              {activeTab === 'abstract' && <AbstractGenerator />}
            </div>

            {/* Results */}
            {analysisResult && (
              <div className="mt-8">
                <ResultDisplay result={analysisResult} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING SECTION - YENİ YER */}
      <section ref={pricingRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Basit ve Şeffaf <span className="text-blue-600">Fiyatlandırma</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Size uygun planı seçin, istediğiniz zaman iptal edin
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md transition font-medium ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md transition font-medium ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  2 ay ücretsiz
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular
                    ? 'ring-2 ring-blue-600 transform scale-105'
                    : 'hover:shadow-2xl transition-shadow'
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
                    {typeof plan.price === 'number' ? (
                      <>
                        <div className="text-4xl font-bold">
                          ${plan.price}
                          <span className="text-lg text-gray-500 font-normal">
                            /{billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </div>
                    )}
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
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                      : plan.name === 'Expert'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Güvenli ödeme yöntemleri</p>
            <div className="flex justify-center space-x-6">
              <span className="text-gray-400">💳 Kredi Kartı</span>
              <span className="text-gray-400">🏦 Banka Kartı</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Kullanıcılarımız Ne Diyor?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "YÖK formatında tez yazmak artık çok kolay. 
                Format hatalarını anında gösteriyor."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold">Ahmet Y.</p>
                  <p className="text-sm text-gray-500">YL Öğrencisi</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Kaynak gösterimi için harika bir araç. 
                APA formatına çevirmek çok pratik."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold">Zeynep K.</p>
                  <p className="text-sm text-gray-500">Doktora Öğrencisi</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Expert plan ile tüm tez sürecim kolaylaştı. 
                Sınırsız kullanım harika!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold">Mehmet A.</p>
                  <p className="text-sm text-gray-500">Araş. Gör.</p>
                </div>
              </div>
            </div>
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

              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
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