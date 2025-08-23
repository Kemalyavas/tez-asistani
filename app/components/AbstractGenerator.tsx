'use client';
import { useState } from 'react';
import { FileText, Loader2, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AbstractGenerator() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [wordCount, setWordCount] = useState('250');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAbstract = async () => {
    if (!text) {
      toast.error('Lütfen tez içeriğini girin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, wordCount: parseInt(wordCount) }),
      });

      const data = await response.json();
      setAbstract(data.abstract);
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tr">Türkçe (Özet)</option>
            <option value="en">İngilizce (Abstract)</option>
            <option value="both">Her İkisi</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kelime Sayısı
          </label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="150">150 kelime</option>
            <option value="250">250 kelime</option>
            <option value="350">350 kelime</option>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={8}
        />
        <p className="text-sm text-gray-500 mt-1">
          {text.split(' ').filter(w => w).length} kelime
        </p>
      </div>

      <button
        onClick={generateAbstract}
        disabled={loading || !text}
        className="w-full btn-primary flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Özet oluşturuluyor...
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