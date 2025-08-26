'use client';
import { useState } from 'react';
import { FileText, Loader2, Languages, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserLimits } from '../hooks/useUserLimits';

export default function AbstractGenerator() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [wordCount, setWordCount] = useState('200-300');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, usage, checkLimit, incrementUsage, limits } = useUserLimits();

  const generateAbstract = async () => {
    if (!text) {
      toast.error('Lütfen tez içeriğini girin');
      return;
    }

    // Limit kontrolü
    const limitCheck = checkLimit('abstract_generations');
    if (!limitCheck.allowed) {
      toast.error(limitCheck.reason || 'Limit aşıldı');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, wordCount }),
      });

      const data = await response.json();
      setAbstract(data.abstract);
      
      // Kullanımı artır
      await incrementUsage('abstract_generations');
      
      toast.success('Özet oluşturuldu!');
    } catch (error) {
      toast.error('Özet oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dil
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-modern"
          >
            <option value="tr">Türkçe (Özet)</option>
            <option value="en">İngilizce (Abstract)</option>
            <option value="both">Her İkisi</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Özet Uzunluğu
          </label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="input-modern"
          >
            <option value="100-150">Kısa Özet (100-150 kelime) - Temel bulgular</option>
            <option value="200-300">Standart Özet (200-300 kelime) - Akademik standart</option>
            <option value="400-500">Detaylı Özet (400-500 kelime) - Kapsamlı analiz</option>
          </select>
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tez İçeriği
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tezinizin ana içeriğini veya bölümlerini buraya yapıştırın..."
          className="input-modern"
          rows={8}
        />
        <p className="text-sm text-gray-500 mt-1">
          {text.split(' ').filter(w => w).length} kelime
        </p>
      </div>

      {/* Usage Info & Limit Warning */}
      {user && (
        <div className={`rounded-lg p-4 ${
          checkLimit('abstract_generations').allowed 
            ? 'bg-green-50' 
            : 'bg-gradient-to-r from-green-50 to-purple-50 border-l-4 border-green-500'
        }`}>
          {checkLimit('abstract_generations').allowed ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                Özet Oluşturma: {usage.abstract_generations} / {limits.abstract_generations === -1 ? '∞' : limits.abstract_generations} kullanıldı
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    Daha çok <strong>Özet Oluşturma</strong> için Pro üyelik alın
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Pro Al
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={generateAbstract}
        disabled={loading || !text || !user || !checkLimit('abstract_generations').allowed}
        className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Özet oluşturuluyor...
          </>
        ) : !user ? (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Giriş Yapın
          </>
        ) : !checkLimit('abstract_generations').allowed ? (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Limit Aşıldı
          </>
        ) : (
          <>
            <Languages className="h-5 w-5 mr-2" />
            Özet Oluştur
          </>
        )}
      </button>

      {/* Generated Abstract */}
      {abstract && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {language === 'tr' ? 'Özet' : language === 'en' ? 'Abstract' : 'Özet & Abstract'}
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap">{abstract}</p>
          </div>
        </div>
      )}
    </div>
  );
}