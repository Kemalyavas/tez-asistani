'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle, Coins, Zap, CheckCircle, FileText, Brain, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_COSTS, getAnalysisTier } from '../lib/pricing';

interface FileUploaderProps {
  onAnalysisComplete: (result: any) => void;
}

type AnalysisStep = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'finalizing' | 'complete' | 'error';

const ANALYSIS_STEPS = [
  { id: 'uploading', label: 'Uploading file', icon: Upload },
  { id: 'processing', label: 'Processing document', icon: FileText },
  { id: 'analyzing', label: 'AI Analysis', icon: Brain },
  { id: 'finalizing', label: 'Generating report', icon: BarChart3 },
];

export default function FileUploader({ onAnalysisComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [estimatedPages, setEstimatedPages] = useState<number | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number>(10);
  const [user, setUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { currentCredits, loading: creditsLoading, refresh: refreshCredits } = useCredits();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      
      // Estimate page count from file size (rough: 50KB per page for PDF)
      const estimatedPagesFromSize = Math.ceil(uploadedFile.size / 50000);
      setEstimatedPages(estimatedPagesFromSize);
      
      // Get estimated credits based on tier
      const tier = getAnalysisTier(estimatedPagesFromSize);
      const actionType = `thesis_${tier.id}` as keyof typeof CREDIT_COSTS;
      setEstimatedCredits(CREDIT_COSTS[actionType]?.creditsRequired || 10);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for analysis status
  const pollAnalysisStatus = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('thesis_documents')
        .select('status, analysis_result, overall_score')
        .eq('id', docId)
        .single();

      if (error) {
        console.error('Polling error:', error);
        return;
      }

      if (data.status === 'analyzed' && data.analysis_result) {
        // Analysis complete!
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        setCurrentStep('complete');
        setStatusMessage('Analysis completed!');
        await refreshCredits();

        // Transform the result to match expected format
        const result = data.analysis_result;
        onAnalysisComplete({
          success: true,
          overall_score: result.overall_score || result.overallScore,
          grade_category: result.grade_category || result.gradeCategory,
          summary: result.summary,
          category_scores: result.category_scores || {
            structure: result.categoryScores?.structure,
            methodology: result.categoryScores?.methodology,
            writing_quality: result.categoryScores?.writingQuality,
            references: result.categoryScores?.references
          },
          critical_issues: result.critical_issues || result.criticalIssues || [],
          major_issues: result.major_issues || result.majorIssues || [],
          minor_issues: result.minor_issues || result.minorIssues || [],
          strengths: result.strengths || [],
          immediate_actions: result.immediate_actions || result.immediateActions || [],
          recommendations: result.recommendations || [],
          metadata: result.metadata || {}
        });

        toast.success('Analysis complete!');
        setLoading(false);

      } else if (data.status === 'failed') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        setCurrentStep('error');
        setStatusMessage('Analysis failed. Your credits have been refunded.');
        toast.error('Analysis failed. Please try again.');
        setLoading(false);
      }
      // If still processing, continue polling

    } catch (err) {
      console.error('Poll error:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    // Login check
    if (!user) {
      toast.error('Please login first');
      router.push('/auth');
      return;
    }

    // Credit check
    if (currentCredits < estimatedCredits) {
      toast.error(`Insufficient credits. You need ${estimatedCredits} credits for this analysis.`);
      router.push('/pricing');
      return;
    }

    setLoading(true);
    setCurrentStep('uploading');
    setStatusMessage('Uploading your file...');

    try {
      // Step 1: Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('thesis-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setCurrentStep('processing');
      setStatusMessage('Processing document...');

      // Step 2: Start analysis (returns immediately with document ID)
      const response = await fetch('/api/analyze/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: uploadData.path,
          fileName: file.name
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`Insufficient credits. Need ${data.creditsRequired} credits.`);
          router.push('/pricing');
          setLoading(false);
          setCurrentStep('idle');
          return;
        }
        throw new Error(data.error || 'Analysis failed to start');
      }

      // Store the document ID and start polling
      const docId = data.documentId;
      setAnalysisId(docId);
      setCurrentStep('analyzing');
      setStatusMessage('AI is analyzing your thesis...');

      // Start polling for status updates
      pollingRef.current = setInterval(() => {
        pollAnalysisStatus(docId);
      }, 3000); // Poll every 3 seconds

      // Also trigger the actual analysis in background
      fetch('/api/analyze/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          filePath: uploadData.path,
          fileName: file.name
        }),
      }).catch(err => {
        console.error('Background analysis error:', err);
        // Don't throw - polling will catch the failure status
      });

    } catch (error: any) {
      setCurrentStep('error');
      setStatusMessage(error.message || 'An error occurred');
      toast.error(error.message || 'An error occurred. Please try again.');
      console.error(error);
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setEstimatedPages(null);
    setEstimatedCredits(10);
    setCurrentStep('idle');
    setStatusMessage('');
    setAnalysisId(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const getStepStatus = (stepId: string): 'pending' | 'active' | 'completed' => {
    const stepOrder = ['uploading', 'processing', 'analyzing', 'finalizing'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentStep === 'complete') return 'completed';
    if (currentStep === 'error') return stepIndex <= currentIndex ? 'active' : 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Credit Balance Indicator */}
      {user && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Your Credits: <strong className="text-lg">{creditsLoading ? '...' : currentCredits}</strong>
              </span>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition flex items-center"
            >
              <Zap className="h-4 w-4 mr-1" />
              Buy Credits
            </button>
          </div>
          {file && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">
                  Estimated: ~{estimatedPages} pages → <strong>{estimatedCredits} credits</strong>
                </span>
                <span className={`font-medium ${currentCredits >= estimatedCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {currentCredits >= estimatedCredits ? '✓ Sufficient' : '✗ Need more credits'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login alert */}
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              You need to <button onClick={() => router.push('/auth')} className="font-bold underline">login</button> to analyze your thesis.
            </span>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop your file here...</p>
        ) : (
          <div>
            <p className="text-gray-700 mb-2">
              Drag and drop your thesis file or click to select
            </p>
            <p className="text-sm text-gray-500">PDF or DOCX (Max. 10MB)</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Progress Steps - shown during analysis */}
      {loading && currentStep !== 'idle' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            {ANALYSIS_STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all ${
                    status === 'completed' ? 'bg-green-100' :
                    status === 'active' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : status === 'active' ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'active' ? 'text-blue-600' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {status === 'active' && currentStep === step.id && (
                      <p className="text-sm text-gray-500">{statusMessage}</p>
                    )}
                  </div>
                  {index < ANALYSIS_STEPS.length - 1 && (
                    <div className={`hidden sm:block absolute left-5 mt-10 w-0.5 h-4 ${
                      status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Estimated time message */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {currentStep === 'analyzing'
                  ? 'AI analysis may take 1-3 minutes depending on document size'
                  : 'Please wait...'}
              </span>
              {analysisId && (
                <span className="text-gray-400 text-xs">ID: {analysisId.slice(0, 8)}...</span>
              )}
            </div>
          </div>

          {/* Error state */}
          {currentStep === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{statusMessage}</span>
              </div>
              <button
                onClick={removeFile}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again with a different file
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || loading || !user}
        className="w-full btn-primary flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            {currentStep === 'uploading' ? 'Uploading...' :
             currentStep === 'processing' ? 'Processing...' :
             currentStep === 'analyzing' ? 'Analyzing...' :
             currentStep === 'finalizing' ? 'Finalizing...' :
             'Please wait...'}
          </>
        ) : (
          'Analyze Thesis'
        )}
      </button>
    </div>
  );
}