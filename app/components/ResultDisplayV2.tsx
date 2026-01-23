'use client';

import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  PenTool,
  ListChecks,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import type { FinalAnalysisResult, Issue } from '@/app/lib/agents/types';

interface ResultDisplayV2Props {
  result: FinalAnalysisResult;
  onDownloadPDF?: () => void;
}

const CATEGORY_INFO = {
  structure: {
    label: 'Yapı & Organizasyon',
    icon: FileText,
    description: 'Tezin genel yapısı ve bölüm organizasyonu',
  },
  methodology: {
    label: 'Metodoloji',
    icon: BookOpen,
    description: 'Araştırma yöntemi ve veri analizi',
  },
  writing_quality: {
    label: 'Yazım Kalitesi',
    icon: PenTool,
    description: 'Akademik dil ve argümantasyon',
  },
  references: {
    label: 'Kaynaklar',
    icon: ListChecks,
    description: 'Atıf formatı ve kaynak kalitesi',
  },
  originality: {
    label: 'Özgünlük',
    icon: Sparkles,
    description: 'Araştırma katkısı ve özgün yaklaşım',
  },
};

const SEVERITY_CONFIG = {
  critical: {
    label: 'Kritik',
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
  },
  major: {
    label: 'Önemli',
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-500',
  },
  minor: {
    label: 'Küçük',
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#F97316';
    return '#EF4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-800">{score}</span>
        <span className="text-sm text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

function CategoryCard({
  categoryKey,
  data,
}: {
  categoryKey: string;
  data: { score: number; feedback: string; issues: Issue[]; strengths: string[] };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const info = CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO];
  if (!info) return null;

  const Icon = info.icon;
  const issueCount = data.issues?.length || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="ml-3 text-left">
            <h3 className="font-semibold text-gray-800">{info.label}</h3>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold text-gray-800">{data.score}</div>
            <div className="text-xs text-gray-500">puan</div>
          </div>
          {issueCount > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              {issueCount} sorun
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Feedback */}
          <p className="text-sm text-gray-600 mt-3 mb-4">{data.feedback}</p>

          {/* Strengths */}
          {data.strengths && data.strengths.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-green-700 mb-2">Güçlü Yönler</h4>
              <ul className="space-y-1">
                {data.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {data.issues && data.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tespit Edilen Sorunlar</h4>
              <div className="space-y-2">
                {data.issues.map((issue, index) => {
                  const config = SEVERITY_CONFIG[issue.severity as keyof typeof SEVERITY_CONFIG];
                  const SeverityIcon = config?.icon || Info;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${config?.bgColor} ${config?.borderColor}`}
                    >
                      <div className="flex items-start">
                        <SeverityIcon
                          className={`w-4 h-4 ${config?.iconColor} mt-0.5 flex-shrink-0`}
                        />
                        <div className="ml-2">
                          <p className={`text-sm ${config?.textColor}`}>{issue.description}</p>
                          {issue.suggestion && (
                            <p className="text-xs text-gray-600 mt-1">
                              <strong>Öneri:</strong> {issue.suggestion}
                            </p>
                          )}
                          {issue.location && (
                            <p className="text-xs text-gray-500 mt-1">📍 {issue.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IssuesList({ issues, severity }: { issues: Issue[]; severity: string }) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  if (!config || issues.length === 0) return null;

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.bgColor} ${config.borderColor} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
        <h3 className={`font-semibold ${config.textColor}`}>
          {config.label} Sorunlar ({issues.length})
        </h3>
      </div>
      <ul className="space-y-2">
        {issues.slice(0, 5).map((issue, index) => (
          <li key={index} className={`text-sm ${config.textColor}`}>
            <span className="font-medium">{issue.category}:</span> {issue.description}
          </li>
        ))}
        {issues.length > 5 && (
          <li className={`text-sm ${config.textColor} italic`}>
            ve {issues.length - 5} sorun daha...
          </li>
        )}
      </ul>
    </div>
  );
}

export function ResultDisplayV2({ result, onDownloadPDF }: ResultDisplayV2Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section - Overall Score */}
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white"
        style={{ borderColor: result.grade.color, borderWidth: '2px' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Tez Analiz Sonuçları</h2>
            <p className="text-gray-400 mb-4">
              {result.analysisTier === 'comprehensive'
                ? 'Kapsamlı Analiz (Çapraz Doğrulama Dahil)'
                : result.analysisTier === 'standard'
                ? 'Standart Analiz'
                : 'Temel Analiz'}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="px-4 py-2 rounded-full text-lg font-bold"
                style={{ backgroundColor: result.grade.color }}
              >
                {result.grade.letter}
              </span>
              <span className="text-xl">{result.grade.label}</span>
            </div>
          </div>
          <ScoreRing score={result.overallScore} size={140} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF İndir
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
            Paylaş
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sayfa', value: result.metadata.pageCount },
          { label: 'Kelime', value: result.metadata.wordCount.toLocaleString() },
          { label: 'Kaynak', value: result.metadata.referenceCount },
          { label: 'Güncel Kaynak', value: result.metadata.recentReferenceCount },
        ].map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{item.value}</div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Issues Summary */}
      {result.issues.total > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Tespit Edilen Sorunlar</h2>
          <IssuesList issues={result.issues.critical} severity="critical" />
          <IssuesList issues={result.issues.major} severity="major" />
          <IssuesList issues={result.issues.minor} severity="minor" />
        </div>
      )}

      {/* Immediate Actions */}
      {result.immediateActions && result.immediateActions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-bold text-yellow-800">Öncelikli Düzeltmeler</h2>
          </div>
          <ol className="list-decimal list-inside space-y-2">
            {result.immediateActions.map((action, index) => (
              <li key={index} className="text-sm text-yellow-700">
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Category Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Detaylı Değerlendirme</h2>
        {Object.entries(result.categoryScores).map(([key, data]) => (
          <CategoryCard key={key} categoryKey={key} data={data} />
        ))}
      </div>

      {/* Strengths */}
      {result.strengths && result.strengths.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-green-800">Güçlü Yönler</h2>
          </div>
          <ul className="grid md:grid-cols-2 gap-2">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-blue-800">Geliştirme Önerileri</h2>
          </div>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start text-sm text-blue-700">
                <span className="mr-2">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>
          Analiz: {new Date(result.analyzedAt).toLocaleString('tr-TR')}
          {result.crossValidated && ' • Çapraz Doğrulama Uygulandı'}
        </p>
        <p className="mt-1">
          TezAI - Yapay Zeka Destekli Tez Analiz Platformu
        </p>
      </div>
    </div>
  );
}

export default ResultDisplayV2;
