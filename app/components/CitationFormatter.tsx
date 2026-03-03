'use client';
import { useState } from 'react';
import { Book, Link, Copy, Check, Lock, AlertCircle, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_COSTS } from '../lib/pricing';

export default function CitationFormatter() {
  const [source, setSource] = useState('');
  const [type, setType] = useState('book');
  const [format, setFormat] = useState('apa');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, credits, checkCredits, refresh } = useCredits();
  const creditCost = CREDIT_COSTS.citation_format.creditsRequired;

  const handleFormat = async () => {
    if (!source) {
      toast.error('Lütfen kaynak bilgisi girin');
      return;
    }

    // Kredi kontrolü
    const creditCheck = checkCredits('citation_format');
    if (!creditCheck.allowed) {
      toast.error(creditCheck.reason || 'Yetersiz kredi');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/format-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, type, format }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Formatlama başarısız');
      }

      setResult(data.formatted);

      // Kredi bakiyesini güncelle (API zaten kredi kesti)
      await refresh();

      toast.success(`Kaynak formatlandı! (${creditCost} kredi kullanıldı)`);
    } catch (error: any) {
      toast.error(error.message || 'Formatlama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
  toast.success('Panoya kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Source Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kaynak Türü
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['book', 'article', 'website'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 px-4 rounded-lg border ${
                type === t
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'book' ? 'Kitap' : t === 'article' ? 'Makale' : 'Web Sitesi'}
            </button>
          ))}
        </div>
      </div>

      {/* Format Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format Stili
        </label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="input-modern"
        >
          <option value="apa">APA 7</option>
          <option value="mla">MLA 9</option>
          <option value="chicago">Chicago</option>
          <option value="ieee">IEEE</option>
        </select>
      </div>

      {/* Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kaynak Bilgisi
        </label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={
            type === 'website'
              ? 'URL veya web sitesi başlığı girin...'
              : type === 'book'
              ? 'Yazar adı, kitap başlığı, yayınevi, yıl...'
              : 'Makale başlığı, dergi adı, cilt, sayı...'
          }
          className="input-modern"
          rows={3}
        />
      </div>

      {/* Credit Info */}
      {user && (
        <div className={`rounded-lg p-4 ${
          checkCredits('citation_format').allowed
            ? 'bg-blue-50'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500'
        }`}>
          {checkCredits('citation_format').allowed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>{credits.credits}</strong> krediniz var • Bu işlem <strong>{creditCost}</strong> kredi harcar
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
                    Bu işlem için <strong>{creditCost}</strong> kredi gerekiyor, mevcut krediniz: <strong>{credits.credits}</strong>
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
        onClick={handleFormat}
        disabled={loading || !user || !checkCredits('citation_format').allowed}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Formatlanıyor...</span>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Giriş Yap</span>
          </div>
        ) : !checkCredits('citation_format').allowed ? (
          <div className="flex items-center justify-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Yetersiz Kredi</span>
          </div>
        ) : (
          `Formatla (${creditCost} kredi)`
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <label className="text-sm font-medium text-gray-700">
              Formatlanan Kaynak
            </label>
            <button
              onClick={copyToClipboard}
              className="text-blue-600 hover:text-blue-700"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-gray-800 bg-white p-3 rounded border border-gray-200">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}