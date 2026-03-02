'use client';
import { useState } from 'react';
import { FileText, Loader2, Languages, Lock, AlertCircle, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_COSTS } from '../lib/pricing';

export default function AbstractGenerator() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [wordCount, setWordCount] = useState('200-300');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, credits, checkCredits, refresh } = useCredits();
  const creditCost = CREDIT_COSTS.abstract_generate.creditsRequired;

  const generateAbstract = async () => {
    if (!text) {
      toast.error('Lütfen tez içeriğini girin');
      return;
    }

    // Kredi kontrolü
    const creditCheck = checkCredits('abstract_generate');
    if (!creditCheck.allowed) {
      toast.error(creditCheck.reason || 'Yetersiz kredi');
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

      if (!response.ok) {
        throw new Error(data.error || 'Özet oluşturulamadı');
      }

      setAbstract(data.abstract);

      // Kredi bakiyesini güncelle (API zaten kredi kesti)
      await refresh();

      toast.success(`Özet oluşturuldu! (${creditCost} kredi kullanıldı)`);
    } catch (error: any) {
      toast.error(error.message || 'Özet oluşturulamadı');
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

      {/* Credit Info */}
      {user && (
        <div className={`rounded-lg p-4 ${
          checkCredits('abstract_generate').allowed
            ? 'bg-green-50'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500'
        }`}>
          {checkCredits('abstract_generate').allowed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">
                  <strong>{credits.credits}</strong> krediniz var • Bu işlem <strong>{creditCost}</strong> kredi
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    <strong>{creditCost}</strong> krediye ihtiyacınız var ama <strong>{credits.credits}</strong> krediniz var
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Kredi Satın Al
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={generateAbstract}
        disabled={loading || !text || !user || !checkCredits('abstract_generate').allowed}
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
            Giriş Yap
          </>
        ) : !checkCredits('abstract_generate').allowed ? (
          <>
            <Coins className="h-5 w-5 mr-2" />
            Yetersiz Kredi
          </>
        ) : (
          <>
            <Languages className="h-5 w-5 mr-2" />
            Özet Oluştur ({creditCost} kredi)
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