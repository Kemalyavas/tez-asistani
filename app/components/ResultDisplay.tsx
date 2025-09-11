'use client';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, TrendingUp, Award } from 'lucide-react';

interface ResultDisplayProps {
  result: {
    overall_score: number;
    grade_category: string;
    summary: string;
    critical_issues: Array<{
      title: string;
      description: string;
      impact: 'critical' | 'major' | 'minor';
      solution: string;
      example: string;
    }>;
    category_scores: {
      structure: { score: number; feedback: string };
      methodology: { score: number; feedback: string };
      writing_quality: { score: number; feedback: string };
      references: { score: number; feedback: string };
    };
    strengths: string[];
    immediate_actions: string[];
    recommendations: string[];
  };
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'major':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'minor':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getGradeColor = (category: string) => {
    switch (category) {
      case 'Mükemmel':
        return 'text-green-600 bg-green-100';
      case 'İyi':
        return 'text-blue-600 bg-blue-100';
      case 'Orta':
        return 'text-yellow-600 bg-yellow-100';
      case 'Zayıf':
        return 'text-orange-600 bg-orange-100';
      case 'Yetersiz':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Genel Puan</h3>
            <p className="text-gray-600">YÖK formatına uygunluk</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
              {result.overall_score}/100
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(result.grade_category)}`}>
              {result.grade_category}
            </span>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-gray-700">{result.summary}</p>
        </div>
      </div>

      {/* Category Scores */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Kategori Puanları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Yapısal Analiz</span>
              <span className={`font-bold ${getScoreColor(result.category_scores.structure.score * 4)}`}>
                {result.category_scores.structure.score}/25
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.category_scores.structure.feedback}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Metodoloji</span>
              <span className={`font-bold ${getScoreColor(result.category_scores.methodology.score * 4)}`}>
                {result.category_scores.methodology.score}/25
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.category_scores.methodology.feedback}</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Yazım Kalitesi</span>
              <span className={`font-bold ${getScoreColor(result.category_scores.writing_quality.score * 4)}`}>
                {result.category_scores.writing_quality.score}/25
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.category_scores.writing_quality.feedback}</p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Kaynak Kullanımı</span>
              <span className={`font-bold ${getScoreColor(result.category_scores.references.score * 4)}`}>
                {result.category_scores.references.score}/25
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.category_scores.references.feedback}</p>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      {result.critical_issues.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Kritik Sorunlar
          </h3>
          <div className="space-y-4">
            {result.critical_issues.map((issue, index) => (
              <div key={index} className="border-l-4 border-red-400 pl-4 py-2">
                <div className="flex items-start space-x-3">
                  {getImpactIcon(issue.impact)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    {issue.example && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                        {issue.example}
                      </div>
                    )}
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-800">Çözüm:</p>
                      <p className="text-sm text-blue-700">{issue.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-green-600" />
            Güçlü Yönler
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Immediate Actions */}
      {result.immediate_actions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-red-600">🚨 Acil Düzeltmeler</h3>
          <ul className="space-y-2">
            {result.immediate_actions.map((action, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-600 mt-1 font-bold">•</span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">💡 Geliştirme Önerileri</h3>
          <ul className="space-y-2">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}