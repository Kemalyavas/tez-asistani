'use client';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ResultDisplayProps {
  result: {
    formatIssues: Array<{ type: string; message: string; severity: 'error' | 'warning' | 'info' }>;
    suggestions: string[];
    score: number;
  };
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold mb-1">Genel Puan</h3>
            <p className="text-gray-600">YÖK formatına uygunluk</p>
          </div>
          <div className="text-4xl font-bold text-blue-600">
            {result.score}/100
          </div>
        </div>
      </div>

      {/* Format Issues */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Format Kontrol Sonuçları</h3>
        <div className="space-y-3">
          {result.formatIssues.map((issue, index) => (
            <div key={index} className="flex items-start space-x-3">
              {getIcon(issue.severity)}
              <div className="flex-1">
                <p className="font-medium">{issue.type}</p>
                <p className="text-sm text-gray-600">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">İyileştirme Önerileri</h3>
        <ul className="space-y-2">
          {result.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-gray-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}