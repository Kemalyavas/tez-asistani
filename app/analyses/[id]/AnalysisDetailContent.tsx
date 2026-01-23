'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Star,
  Target,
  BookOpen,
  PenTool,
  Quote,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PremiumResultDisplay from '@/app/components/PremiumResultDisplay';

interface CategoryScore {
  score: number;
  feedback: string;
}

interface Issue {
  title: string;
  description: string;
  impact: string;
  solution: string;
  example?: string;
}

interface AnalysisResult {
  overall_score: number;
  grade_category: string;
  summary: string;
  category_scores: {
    structure: CategoryScore;
    methodology: CategoryScore;
    writing_quality: CategoryScore;
    references: CategoryScore;
  };
  critical_issues: Issue[];
  major_issues: Issue[];
  minor_issues: Issue[];
  strengths: string[];
  immediate_actions: string[];
  recommendations: string[];
  metadata: {
    sections_found: string[];
    missing_sections: string[];
  };
  // Premium format properties
  sections?: any;
  yokCompliance?: any;
  priorityActions?: any;
}

interface ThesisDocument {
  id: string;
  filename: string;
  status: 'processing' | 'analyzed' | 'failed';
  overall_score: number | null;
  page_count: number;
  word_count: number;
  analysis_type: string;
  credits_used: number;
  created_at: string;
  analyzed_at: string | null;
  analysis_result: AnalysisResult | null;
}

interface AnalysisDetailContentProps {
  analysisId: string;
}

export default function AnalysisDetailContent({ analysisId }: AnalysisDetailContentProps) {
  const [analysis, setAnalysis] = useState<ThesisDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/auth');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('thesis_documents')
          .select('*')
          .eq('id', analysisId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Analysis not found');
          } else {
            setError('Failed to load analysis');
          }
          return;
        }

        setAnalysis(data as ThesisDocument);
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, supabase, router]);

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure': return BookOpen;
      case 'methodology': return Target;
      case 'writing_quality': return PenTool;
      case 'references': return Quote;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'structure': return 'Structure';
      case 'methodology': return 'Methodology';
      case 'writing_quality': return 'Writing Quality';
      case 'references': return 'References';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Analysis not found'}</h2>
          <p className="text-gray-500 mb-6">The analysis you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/analyses"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Analyses
          </Link>
        </div>
      </div>
    );
  }

  const result = analysis.analysis_result;

  // Premium format kontrolü (sections veya yokCompliance varsa yeni format)
  const isPremiumFormat = result && (result.sections || result.yokCompliance || result.priorityActions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/analyses"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Analizlere Dön</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{analysis.filename}</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Status Banner for Processing/Failed */}
        {analysis.status === 'processing' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mr-4" />
              <div>
                <h3 className="font-semibold text-amber-800">Analysis in Progress</h3>
                <p className="text-amber-600">Your thesis is being analyzed. This page will update automatically when complete.</p>
              </div>
            </div>
          </div>
        )}

        {analysis.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <h3 className="font-semibold text-red-800">Analiz Başarısız</h3>
                <p className="text-red-600">Teziniz analiz edilirken bir hata oluştu. Kredileriniz iade edildi.</p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Format - Yeni gelişmiş sonuç gösterimi */}
        {isPremiumFormat && result && (
          <PremiumResultDisplay result={result as any} />
        )}

        {/* Eski format için mevcut gösterim */}
        {!isPremiumFormat && result && (
          <>
            {/* Analysis Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{analysis.filename}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {analysis.page_count} pages
                </span>
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {analysis.word_count?.toLocaleString()} words
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {analysis.analysis_type === 'basic' ? 'Basic' :
                   analysis.analysis_type === 'standard' ? 'Standard' : 'Comprehensive'} Analysis
                </span>
              </div>
            </div>

            {result && (
              <div className="flex items-center gap-4">
                <div className={`text-center px-6 py-4 rounded-xl ${getScoreBgColor(result.overall_score)}`}>
                  <div className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                    {result.overall_score}
                  </div>
                  <div className="text-sm text-gray-600">out of 100</div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold ${getGradeColor(result.grade_category)}`}>
                  Grade: {result.grade_category}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-600">{result.summary}</p>
            </div>
          )}
        </div>

        {result && (
          <>
            {/* Category Scores */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.category_scores).map(([category, data]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="font-medium text-gray-900">{getCategoryLabel(category)}</span>
                        </div>
                        <span className={`text-xl font-bold ${getScoreColor(data.score)}`}>
                          {data.score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 80 ? 'bg-green-500' :
                            data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">{data.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issues Section */}
            {(result.critical_issues.length > 0 || result.major_issues.length > 0 || result.minor_issues.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Issues Found</h3>

                {/* Critical Issues */}
                {result.critical_issues.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-red-600">Critical Issues ({result.critical_issues.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {result.critical_issues.map((issue, index) => (
                        <IssueCard
                          key={`critical-${index}`}
                          issue={issue}
                          type="critical"
                          isExpanded={expandedIssues.has(`critical-${index}`)}
                          onToggle={() => toggleIssue(`critical-${index}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Major Issues */}
                {result.major_issues.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                      <h4 className="font-semibold text-orange-600">Major Issues ({result.major_issues.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {result.major_issues.map((issue, index) => (
                        <IssueCard
                          key={`major-${index}`}
                          issue={issue}
                          type="major"
                          isExpanded={expandedIssues.has(`major-${index}`)}
                          onToggle={() => toggleIssue(`major-${index}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Minor Issues */}
                {result.minor_issues.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <Info className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-semibold text-blue-600">Minor Issues ({result.minor_issues.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {result.minor_issues.map((issue, index) => (
                        <IssueCard
                          key={`minor-${index}`}
                          issue={issue}
                          type="minor"
                          isExpanded={expandedIssues.has(`minor-${index}`)}
                          onToggle={() => toggleIssue(`minor-${index}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Immediate Actions */}
            {result.immediate_actions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Zap className="h-5 w-5 text-amber-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Immediate Actions</h3>
                </div>
                <ul className="space-y-2">
                  {result.immediate_actions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-amber-100 text-amber-700 font-bold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Lightbulb className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
                </div>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-purple-100 text-purple-700 w-2 h-2 rounded-full mr-3 flex-shrink-0 mt-2" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections Found */}
            {result.metadata && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.metadata.sections_found?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Sections Found
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.metadata.sections_found.map((section, index) => (
                          <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.metadata.missing_sections?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        Missing Sections
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.metadata.missing_sections.map((section, index) => (
                          <span key={index} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}

// Issue Card Component
function IssueCard({
  issue,
  type,
  isExpanded,
  onToggle
}: {
  issue: Issue;
  type: 'critical' | 'major' | 'minor';
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const bgColor = type === 'critical' ? 'bg-red-50 border-red-200' :
                  type === 'major' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200';

  return (
    <div className={`border rounded-lg ${bgColor}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{issue.title}</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Description:</p>
            <p className="text-sm text-gray-600">{issue.description}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Impact:</p>
            <p className="text-sm text-gray-600">{issue.impact}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Solution:</p>
            <p className="text-sm text-gray-600">{issue.solution}</p>
          </div>
          {issue.example && (
            <div>
              <p className="text-sm font-medium text-gray-700">Example:</p>
              <p className="text-sm text-gray-600 bg-white/50 p-2 rounded">{issue.example}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
