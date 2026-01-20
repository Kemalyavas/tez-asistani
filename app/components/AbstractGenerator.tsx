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
      toast.error('Please enter thesis content');
      return;
    }

    // Kredi kontrolü
    const creditCheck = checkCredits('abstract_generate');
    if (!creditCheck.allowed) {
      toast.error(creditCheck.reason || 'Insufficient credits');
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
        throw new Error(data.error || 'Failed to generate abstract');
      }

      setAbstract(data.abstract);

      // Kredi bakiyesini güncelle (API zaten kredi kesti)
      await refresh();

      toast.success(`Abstract generated! (${creditCost} credits used)`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate abstract');
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
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-modern"
          >
            <option value="tr">Turkish (Summary)</option>
            <option value="en">English (Abstract)</option>
            <option value="both">Both</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abstract Length
          </label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="input-modern"
          >
            <option value="100-150">Short Abstract (100-150 words) - Key findings</option>
            <option value="200-300">Standard Abstract (200-300 words) - Academic standard</option>
            <option value="400-500">Detailed Abstract (400-500 words) - Comprehensive analysis</option>
          </select>
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thesis Content
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the main content or sections of your thesis here..."
          className="input-modern"
          rows={8}
        />
        <p className="text-sm text-gray-500 mt-1">
          {text.split(' ').filter(w => w).length} words
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
                  You have <strong>{credits.credits}</strong> credits • This action costs <strong>{creditCost}</strong> credits
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
                    You need <strong>{creditCost}</strong> credits but have <strong>{credits.credits}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Buy Credits
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
            Generating abstract...
          </>
        ) : !user ? (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Sign In
          </>
        ) : !checkCredits('abstract_generate').allowed ? (
          <>
            <Coins className="h-5 w-5 mr-2" />
            Insufficient Credits
          </>
        ) : (
          <>
            <Languages className="h-5 w-5 mr-2" />
            Generate Abstract ({creditCost} credits)
          </>
        )}
      </button>

      {/* Generated Abstract */}
      {abstract && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {language === 'tr' ? 'Summary' : language === 'en' ? 'Abstract' : 'Summary & Abstract'}
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap">{abstract}</p>
          </div>
        </div>
      )}
    </div>
  );
}