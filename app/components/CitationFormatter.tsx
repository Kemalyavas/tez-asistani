'use client';
import { useState } from 'react';
import { Book, Link, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitationFormatter() {
  const [source, setSource] = useState('');
  const [type, setType] = useState('book');
  const [format, setFormat] = useState('apa');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFormat = async () => {
    if (!source) {
      toast.error('Lütfen kaynak bilgisi girin');
      return;
    }

    try {
      const response = await fetch('/api/format-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, type, format }),
      });

      const data = await response.json();
      setResult(data.formatted);
      toast.success('Kaynak formatlandı!');
    } catch (error) {
      toast.error('Formatlama başarısız');
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

      <button onClick={handleFormat} className="w-full btn-primary">
        Formatla
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