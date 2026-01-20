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
      toast.error('Please enter source information');
      return;
    }

    // Kredi kontrolü
    const creditCheck = checkCredits('citation_format');
    if (!creditCheck.allowed) {
      toast.error(creditCheck.reason || 'Insufficient credits');
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
        throw new Error(data.error || 'Formatting failed');
      }

      setResult(data.formatted);

      // Kredi bakiyesini güncelle (API zaten kredi kesti)
      await refresh();

      toast.success(`Citation formatted! (${creditCost} credit used)`);
    } catch (error: any) {
      toast.error(error.message || 'Formatting failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
  toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Source Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Source Type
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
              {t === 'book' ? 'Book' : t === 'article' ? 'Article' : 'Website'}
            </button>
          ))}
        </div>
      </div>

      {/* Format Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format Style
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
          Source Information
        </label>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={
            type === 'website'
              ? 'Enter URL or website title...'
              : type === 'book'
              ? 'Author name, book title, publisher, year...'
              : 'Article title, journal name, volume, issue...'
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
                  You have <strong>{credits.credits}</strong> credits • This action costs <strong>{creditCost}</strong> credit
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
                    You need <strong>{creditCost}</strong> credit but have <strong>{credits.credits}</strong>
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
        onClick={handleFormat}
        disabled={loading || !user || !checkCredits('citation_format').allowed}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Formatting...</span>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Sign In</span>
          </div>
        ) : !checkCredits('citation_format').allowed ? (
          <div className="flex items-center justify-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Insufficient Credits</span>
          </div>
        ) : (
          `Format (${creditCost} credit)`
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <label className="text-sm font-medium text-gray-700">
              Formatted Citation
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