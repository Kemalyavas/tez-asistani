'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FileUploader from './components/FileUploader';
import ResultDisplay from './components/ResultDisplay';
import CitationFormatter from './components/CitationFormatter';
import AbstractGenerator from './components/AbstractGenerator';
import TestimonialsCarousel from './components/TestimonialsCarousel';
import { Zap, CheckCircle, BookOpen, FileSearch, Check, Coins, Gift, Sparkles } from 'lucide-react';
import { CREDIT_PACKAGES, CREDIT_COSTS } from './lib/pricing';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
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
    { icon: <FileSearch className="h-6 w-6" />, title: 'Format checks', desc: 'Validates against academic standards' },
    { icon: <BookOpen className="h-6 w-6" />, title: 'Citations', desc: 'APA, MLA, or Chicago in one click' },
    { icon: <Zap className="h-6 w-6" />, title: 'Abstracts', desc: 'Clear, concise summaries you can edit' },
    { icon: <CheckCircle className="h-6 w-6" />, title: 'Fast results', desc: 'See issues in seconds, not hours' },
  ];

  // Credit cost info for display
  const creditCostInfo = [
    { action: 'Citation Formatting', credits: CREDIT_COSTS.citation_format.creditsRequired, note: 'APA, MLA, Chicago, IEEE' },
    { action: 'Abstract Generation', credits: CREDIT_COSTS.abstract_generate.creditsRequired, note: 'Turkish, English or Both' },
    { action: 'Thesis Analysis (1-30 pages)', credits: CREDIT_COSTS.thesis_basic.creditsRequired, note: '' },
    { action: 'Thesis Analysis (31-70 pages)', credits: CREDIT_COSTS.thesis_standard.creditsRequired, note: '' },
    { action: 'Thesis Analysis (71+ pages)', credits: CREDIT_COSTS.thesis_comprehensive.creditsRequired, note: 'RAG-powered' },
  ];

  const handleSelectPackage = async (packageId: string) => {

    if (!user) {
      toast.error('Please sign in first');
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
        throw new Error(data.error || 'Payment could not be initiated');
      }
      
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Payment could not be initiated');
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
              Ship a thesis you’re proud of
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              TezAI points out formatting issues, fixes citations, and helps you polish abstracts so you can focus on the research.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-slide-in">
              <button 
                onClick={scrollToApp}
                className="btn-primary text-lg px-8 py-4 min-w-[200px]"
                aria-label="Try TezAI tools for free"
              >
                Try for free
              </button>
              <button 
                onClick={scrollToHowItWorks}
                className="btn-secondary text-lg px-8 py-4 min-w-[200px]"
              >
                How it works
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-12 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Theses Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">2 Minutes</div>
                <div className="text-gray-600">Average Time</div>
              </div>
            </div>
            
            {/* Security Guarantee */}
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-800">Secure and private</h3>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Your thesis files are protected with SSL encryption, automatically deleted after analysis, and never 
                  shared with third parties. <button 
                    onClick={() => document.getElementById('privacy-policy')?.scrollIntoView({ behavior: 'smooth' })}
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer underline"
                  >
                    Privacy Policy
                  </button>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>SSL Security</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Auto Delete</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span>GDPR Compliant</span>
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
            <h2 className="text-4xl font-bold mb-4">Work faster, with fewer mistakes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Concrete checks and suggestions instead of vague “AI magic”.
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
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Get guidance in three steps.</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              
              <div className="text-center group animate-slide-in">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Upload your thesis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your thesis document in PDF or DOCX format to our secure system.
                  <span className="text-blue-600 font-semibold"> Automatic format detection</span> gets you started quickly.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-200">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 no-decoration">Review with AI</h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced AI technology analyzes your thesis in detail according to <span className="text-purple-600 font-semibold">academic standards</span> 
                  and performs format checks.
                </p>
              </div>

              <div className="text-center group animate-slide-in animation-delay-400">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-500">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Get your report</h3>
                <p className="text-gray-600 leading-relaxed">
                  Perfect your thesis with comprehensive analysis report, <span className="text-green-600 font-semibold">correction suggestions</span> and 
                  professional formatting recommendations.
                </p>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="text-center mt-16 animate-fade-in">
              <button 
                onClick={scrollToApp}
                className="btn-primary text-lg px-10 py-4"
              >
                Start free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section id="app" ref={mainAppRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Your thesis assistant</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Try our tools for free.</p>
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
                Upload Thesis
              </button>
              <button
                onClick={() => setActiveTab('citation')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'citation' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                Format Citation
              </button>
              <button
                onClick={() => setActiveTab('abstract')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'abstract' 
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                Generate Abstract
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

  {/* PRICING SECTION - CREDIT-BASED */}
      <section id="pricing" ref={pricingRef} className="py-24 gradient-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              Pay Only For What You <span className="text-gradient">Use</span>
            </h2>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              No subscriptions. No monthly fees. Credits never expire.
            </p>
            <p className="text-sm text-gray-500">
              New users get <strong>10 free credits</strong> on signup!
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
                      Best Value
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
                      <span className="text-blue-600 ml-1">credits</span>
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
                    ${pkg.pricePerCredit.toFixed(2)} per credit
                  </p>
                </div>

                {/* What you can do */}
                <div className="space-y-2 mb-6 text-sm">
                  <p className="font-medium text-gray-700">With {pkg.totalCredits} credits:</p>
                  <div className="text-gray-600 space-y-1 text-xs">
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.thesis_standard.creditsRequired)} thesis analyses</p>
                    <p>• ~{Math.floor(pkg.totalCredits / CREDIT_COSTS.abstract_generate.creditsRequired)} abstracts</p>
                    <p>• ~{pkg.totalCredits} citations</p>
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
                  {loadingPlan === pkg.id ? 'Redirecting…' : `Buy ${pkg.totalCredits} Credits`}
                </button>
              </div>
            ))}
          </div>

          {/* Credit Cost Table */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-center mb-6">Credit Costs</h3>
            <div className="space-y-3">
              {creditCostInfo.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-gray-700">{item.action}</span>
                    {item.note && <span className="text-xs text-gray-400 ml-2">({item.note})</span>}
                  </div>
                  <span className="font-semibold text-blue-600">{item.credits} credit{item.credits > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          
          <TestimonialsCarousel />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Do I need a credit card to start?
                </h3>
                <p className="text-gray-600">
                  No! When you sign up, you get <strong>10 free credits</strong> instantly. That's enough for a full thesis analysis or multiple citations and abstracts.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Do credits expire?
                </h3>
                <p className="text-gray-600">
                  No, your credits <strong>never expire</strong>. Buy once and use whenever you need them. No monthly fees, no subscriptions, no pressure.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Which credit package should I choose?
                </h3>
                <p className="text-gray-600">
                  For a single thesis, the <strong>Starter</strong> or <strong>Standard</strong> package is usually enough. If you're working on multiple projects or want the best value, the <strong>Pro</strong> package offers 600 credits with bonus.
                </p>
              </div>

              <div id="privacy-policy" className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-green-800 flex items-center">
                  🔒 Is my thesis safe? Is my privacy protected?
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>100% secure & private!</strong> Your uploaded thesis files:
                </p>
                <ul className="text-gray-600 space-y-1 mb-3">
                  <li>• Are never shared with other users</li>
                  <li>• Are automatically deleted after analysis</li>
                  <li>• Are not used for AI model training</li>
                  <li>• Are protected with SSL encryption</li>
                </ul>
                <p className="text-sm text-gray-600">
                  For more details see our <a href="/privacy-policy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>.
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
            Start Your Thesis Writing Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Use your free analysis right now
          </p>
          <button 
            onClick={scrollToApp}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            Start Free
          </button>
        </div>
      </section>
    </main>
  );
}