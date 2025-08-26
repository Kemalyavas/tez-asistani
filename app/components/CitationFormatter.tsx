'use client';
import { useState } from 'react';
import { Book, Link, Copy, Check, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserLimits } from '../hooks/useUserLimits';

export default function CitationFormatter() {
  const [source, setSource] = useState('');
  const [type, setType] = useState('book');
  const [format, setFormat] = useState('apa');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, usage, checkLimit, incrementUsage, limits } = useUserLimits();

  const handleFormat = async () => {
    if (!source) {
      toast.error('Lütfen kaynak bilgisi girin');
      return;
    }

    // Limit kontrolü
    const limitCheck = checkLimit('citation_formats');
    if (!limitCheck.allowed) {
      toast.error(limitCheck.reason || 'Limit aşıldı');
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
      setResult(data.formatted);
      
      // Kullanımı artır
      await incrementUsage('citation_formats');
      
      toast.success('Kaynak formatlandı!');
    } catch (error) {
      toast.error('Formatlama başarısız');
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
              ? 'URL veya web sitesi başlığını girin...'
              : type === 'book'
              ? 'Yazar adı, kitap adı, yayınevi, yıl...'
              : 'Makale başlığı, dergi adı, cilt, sayı...'
          }
          className="input-modern"
          rows={3}
        />
      </div>

      {/* Usage Info & Limit Warning */}
      {user && (
        <div className={`rounded-lg p-4 ${
          checkLimit('citation_formats').allowed 
            ? 'bg-blue-50' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500'
        }`}>
          {checkLimit('citation_formats').allowed ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                Kaynak Formatlama: {usage.citation_formats} / {limits.citation_formats === -1 ? '∞' : limits.citation_formats} kullanıldı
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    Daha çok <strong>Kaynak Formatlama</strong> için Pro üyelik alın
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Pro Al
              </button>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={handleFormat} 
        disabled={loading || !user || !checkLimit('citation_formats').allowed}
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
            <span>Giriş Yapın</span>
          </div>
        ) : !checkLimit('citation_formats').allowed ? (
          <div className="flex items-center justify-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Limit Aşıldı</span>
          </div>
        ) : (
          'Formatla'
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <label className="text-sm font-medium text-gray-700">
              Formatlanmış Kaynak
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