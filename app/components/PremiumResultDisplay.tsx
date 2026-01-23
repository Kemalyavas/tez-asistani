'use client';

import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  PenTool,
  Quote,
  Layout,
  Target,
  Award,
  TrendingUp,
  MapPin,
  Lightbulb,
  Shield,
  BarChart3
} from 'lucide-react';

interface PremiumResultDisplayProps {
  result: any;
}

export default function PremiumResultDisplay({ result }: PremiumResultDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'priority']));
  const [selectedIssueType, setSelectedIssueType] = useState<'all' | 'critical' | 'major' | 'minor' | 'formatting'>('all');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Grade bilgisi
  const grade = result.grade || {
    letter: result.gradeCategory?.[0] || 'B',
    label: result.gradeCategory || result.grade_category || 'Orta',
    color: '#FBBF24'
  };

  // Bölüm skorları
  const sections = result.sections || result.categoryScores || {};

  // Sorunlar
  const issues = result.issues || {
    critical: result.criticalIssues || result.critical_issues || [],
    major: result.majorIssues || result.major_issues || [],
    minor: result.minorIssues || result.minor_issues || [],
    formatting: result.formattingIssues || []
  };

  // YÖK uyumluluk
  const yokCompliance = result.yokCompliance || { score: 0, compliant: [], nonCompliant: [] };

  // İstatistikler
  const stats = result.statistics || result.metadata || {};

  // Tüm sorunları filtrele
  const getAllIssues = () => {
    if (selectedIssueType === 'all') {
      return [
        ...issues.critical.map((i: any) => ({ ...i, severity: 'critical' })),
        ...issues.major.map((i: any) => ({ ...i, severity: 'major' })),
        ...issues.minor.map((i: any) => ({ ...i, severity: 'minor' })),
        ...issues.formatting.map((i: any) => ({ ...i, severity: 'formatting' })),
      ];
    }
    return (issues[selectedIssueType] || []).map((i: any) => ({ ...i, severity: selectedIssueType }));
  };

  const filteredIssues = getAllIssues();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'major': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'minor': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'formatting': return <Layout className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'major': return 'bg-orange-50 border-orange-200';
      case 'minor': return 'bg-yellow-50 border-yellow-200';
      case 'formatting': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'structure': return <Layout className="h-5 w-5" />;
      case 'methodology': return <Target className="h-5 w-5" />;
      case 'literature': return <BookOpen className="h-5 w-5" />;
      case 'writingQuality': return <PenTool className="h-5 w-5" />;
      case 'references': return <Quote className="h-5 w-5" />;
      case 'formatting': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      structure: 'Yapı ve Organizasyon',
      methodology: 'Metodoloji',
      literature: 'Literatür Taraması',
      writingQuality: 'Yazım Kalitesi',
      references: 'Kaynaklar ve Atıflar',
      formatting: 'Format ve Biçimlendirme',
    };
    return labels[section] || section;
  };

  return (
    <div className="space-y-6">
      {/* Genel Skor Kartı */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tez Analiz Raporu</h2>
              <p className="text-blue-100">Premium AI Değerlendirmesi</p>
            </div>
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                style={{ backgroundColor: grade.color + '33', color: grade.color }}
              >
                {grade.letter}
              </div>
              <p className="mt-2 font-medium">{grade.label}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Genel Puan</span>
            <span className="text-3xl font-bold" style={{ color: grade.color }}>
              {result.overallScore || result.overall_score}/100
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${result.overallScore || result.overall_score}%`,
                backgroundColor: grade.color
              }}
            />
          </div>

          <p className="text-gray-700 leading-relaxed">
            {result.executiveSummary || result.summary}
          </p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center text-gray-500 mb-1">
            <FileText className="h-4 w-4 mr-2" />
            <span className="text-sm">Pages</span>
          </div>
          <p className="text-2xl font-bold">{stats.pageCount != null ? stats.pageCount : '-'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center text-gray-500 mb-1">
            <PenTool className="h-4 w-4 mr-2" />
            <span className="text-sm">Words</span>
          </div>
          <p className="text-2xl font-bold">{stats.wordCount != null ? stats.wordCount.toLocaleString() : '-'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center text-gray-500 mb-1">
            <Quote className="h-4 w-4 mr-2" />
            <span className="text-sm">References</span>
          </div>
          <p className="text-2xl font-bold">{stats.referenceCount != null ? stats.referenceCount : '-'}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center text-gray-500 mb-1">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="text-sm">Figures/Tables</span>
          </div>
          <p className="text-2xl font-bold">{(stats.figureCount ?? 0) + (stats.tableCount ?? 0)}</p>
        </div>
      </div>

      {/* Öncelikli Eylemler */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('priority')}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 border-b"
        >
          <div className="flex items-center">
            <Target className="h-5 w-5 text-orange-600 mr-2" />
            <span className="font-semibold text-gray-800">Öncelikli Eylemler</span>
            <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
              {(result.priorityActions || []).length} eylem
            </span>
          </div>
          {expandedSections.has('priority') ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.has('priority') && (
          <div className="p-4 space-y-3">
            {(result.priorityActions || []).map((action: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  action.estimatedImpact === 'high' ? 'bg-red-50 border-red-200' :
                  action.estimatedImpact === 'medium' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    action.estimatedImpact === 'high' ? 'bg-red-200 text-red-700' :
                    action.estimatedImpact === 'medium' ? 'bg-orange-200 text-orange-700' :
                    'bg-yellow-200 text-yellow-700'
                  }`}>
                    {action.order || index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{action.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                      action.estimatedImpact === 'high' ? 'bg-red-100 text-red-700' :
                      action.estimatedImpact === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {action.estimatedImpact === 'high' ? 'Yüksek Etki' :
                       action.estimatedImpact === 'medium' ? 'Orta Etki' : 'Düşük Etki'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bölüm Skorları */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b"
        >
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-semibold text-gray-800">Bölüm Değerlendirmeleri</span>
          </div>
          {expandedSections.has('sections') ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.has('sections') && (
          <div className="p-4 space-y-4">
            {Object.entries(sections).map(([key, section]: [string, any]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getSectionIcon(key)}
                    <span className="ml-2 font-medium">{getSectionLabel(key)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${
                      section.score >= 80 ? 'text-green-600' :
                      section.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {section.score}/100
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      section.score >= 80 ? 'bg-green-500' :
                      section.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${section.score}%` }}
                  />
                </div>

                <p className="text-sm text-gray-600 mb-3">{section.feedback}</p>

                {section.strengths && section.strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-green-700 mb-1">Güçlü Yönler:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {section.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.improvements && section.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-orange-700 mb-1">İyileştirme Önerileri:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {section.improvements.map((s: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <Lightbulb className="h-3 w-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sorunlar */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('issues')}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border-b"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-semibold text-gray-800">Tespit Edilen Sorunlar</span>
            <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
              {issues.critical.length + issues.major.length + issues.minor.length + issues.formatting.length} sorun
            </span>
          </div>
          {expandedSections.has('issues') ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.has('issues') && (
          <div className="p-4">
            {/* Filtre butonları */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedIssueType('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIssueType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Tümü ({issues.critical.length + issues.major.length + issues.minor.length + issues.formatting.length})
              </button>
              <button
                onClick={() => setSelectedIssueType('critical')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIssueType === 'critical' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'
                }`}
              >
                Kritik ({issues.critical.length})
              </button>
              <button
                onClick={() => setSelectedIssueType('major')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIssueType === 'major' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600'
                }`}
              >
                Önemli ({issues.major.length})
              </button>
              <button
                onClick={() => setSelectedIssueType('minor')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIssueType === 'minor' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                Küçük ({issues.minor.length})
              </button>
              <button
                onClick={() => setSelectedIssueType('formatting')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIssueType === 'formatting' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}
              >
                Format ({issues.formatting.length})
              </button>
            </div>

            {/* Sorun listesi */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredIssues.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Bu kategoride sorun bulunamadı.</p>
              ) : (
                filteredIssues.map((issue: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityBg(issue.severity)}`}
                  >
                    <div className="flex items-start">
                      {getSeverityIcon(issue.severity)}
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-800">{issue.title}</h4>
                          {issue.pageNumber && (
                            <span className="flex items-center text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              <MapPin className="h-3 w-3 mr-1" />
                              Sayfa {issue.pageNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>

                        {issue.originalText && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Orijinal metin:</p>
                            <p className="text-sm italic text-gray-700">"{issue.originalText}"</p>
                          </div>
                        )}

                        {issue.suggestion && (
                          <div className="mt-2 flex items-start">
                            <Lightbulb className="h-4 w-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-700">{issue.suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* YÖK Uyumluluk */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('yok')}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-teal-50 border-b"
        >
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-semibold text-gray-800">YÖK Standartları Uyumluluğu</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
              yokCompliance.score >= 80 ? 'bg-green-100 text-green-700' :
              yokCompliance.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              %{yokCompliance.score}
            </span>
          </div>
          {expandedSections.has('yok') ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.has('yok') && (
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Uyulan standartlar */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uyulan Standartlar ({yokCompliance.compliant?.length || 0})
                </h4>
                <ul className="space-y-2">
                  {(yokCompliance.compliant || []).map((item: string, index: number) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Uyulmayan standartlar */}
              <div className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-3 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Eksik Standartlar ({yokCompliance.nonCompliant?.length || 0})
                </h4>
                <ul className="space-y-2">
                  {(yokCompliance.nonCompliant || []).map((item: string, index: number) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Güçlü Yönler */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('strengths')}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 border-b"
        >
          <div className="flex items-center">
            <Award className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="font-semibold text-gray-800">Güçlü Yönler</span>
            <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
              {(result.strengths || []).length}
            </span>
          </div>
          {expandedSections.has('strengths') ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.has('strengths') && (
          <div className="p-4">
            <ul className="space-y-2">
              {(result.strengths || []).map((strength: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <TrendingUp className="h-5 w-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Meta bilgi */}
      <div className="text-center text-xs text-gray-400 mt-4">
        Analyzed: {new Date(result.metadata?.analyzedAt || Date.now()).toLocaleString('en-US')}
        {' • '}
        Duration: {((result.metadata?.processingTimeMs || 0) / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
