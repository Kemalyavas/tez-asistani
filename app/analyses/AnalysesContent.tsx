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
  BarChart3,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';

interface ThesisAnalysis {
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
}

type SortOption = 'newest' | 'oldest' | 'highest_score' | 'lowest_score';
type StatusFilter = 'all' | 'analyzed' | 'processing' | 'failed';

export default function AnalysesContent() {
  const [analyses, setAnalyses] = useState<ThesisAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('thesis_documents')
          .select('id, filename, status, overall_score, page_count, word_count, analysis_type, credits_used, created_at, analyzed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching analyses:', error);
          return;
        }

        setAnalyses(data as ThesisAnalysis[]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [supabase, router]);

  // Filter and sort analyses
  const filteredAnalyses = analyses
    .filter(analysis => {
      // Search filter
      if (searchQuery && !analysis.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && analysis.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest_score':
          return (b.overall_score ?? 0) - (a.overall_score ?? 0);
        case 'lowest_score':
          return (a.overall_score ?? 0) - (b.overall_score ?? 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'Basic';
      case 'standard': return 'Standard';
      case 'comprehensive': return 'Comprehensive';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Return to Home</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Analyses</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
                <p className="text-sm text-gray-500">Total Analyses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.status === 'analyzed').length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.overall_score !== null).length > 0
                    ? Math.round(
                        analyses
                          .filter(a => a.overall_score !== null)
                          .reduce((sum, a) => sum + (a.overall_score || 0), 0) /
                          analyses.filter(a => a.overall_score !== null).length
                      )
                    : '-'}
                </p>
                <p className="text-sm text-gray-500">Average Score</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.status === 'processing').length}
                </p>
                <p className="text-sm text-gray-500">Processing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="h-5 w-5 mr-2 text-gray-500" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_score">Highest Score</option>
                  <option value="lowest_score">Lowest Score</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="analyzed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Analyses List */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            {analyses.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No analyses yet</h3>
                <p className="text-gray-500 mb-6">Start by analyzing your first thesis!</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Analyze a Thesis
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching analyses</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/analyses/${analysis.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md p-6 transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {analysis.filename}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {analysis.page_count} pages
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(analysis.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {getAnalysisTypeLabel(analysis.analysis_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {analysis.status === 'processing' ? (
                      <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="font-medium">Processing...</span>
                      </div>
                    ) : analysis.status === 'failed' ? (
                      <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Failed</span>
                      </div>
                    ) : analysis.overall_score !== null ? (
                      <div className={`flex items-center px-4 py-2 rounded-lg font-semibold ${getScoreColor(analysis.overall_score)}`}>
                        <TrendingUp className="h-5 w-5 mr-2" />
                        <span className="text-xl">{analysis.overall_score}</span>
                        <span className="text-sm ml-1">/100</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 px-4 py-2">No score</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredAnalyses.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {filteredAnalyses.length} of {analyses.length} analyses
          </p>
        )}
      </div>
    </div>
  );
}
