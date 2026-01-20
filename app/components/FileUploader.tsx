'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle, Coins, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_COSTS, getAnalysisTier } from '../lib/pricing';

interface FileUploaderProps {
  onAnalysisComplete: (result: any) => void;
}

export default function FileUploader({ onAnalysisComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimatedPages, setEstimatedPages] = useState<number | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number>(10);
  const [user, setUser] = useState<any>(null);
  
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
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
          return;
        }
        throw new Error(data.error || 'Analysis failed');
      }

      // Refresh credits after successful analysis
      await refreshCredits();
      
      onAnalysisComplete(data);
      toast.success(`Analysis complete! Used ${data.credits_used} credits.`);
      
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setEstimatedPages(null);
    setEstimatedCredits(10);
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

      <button
        onClick={handleAnalyze}
        disabled={!file || loading || !user}
        className="w-full btn-primary flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Analyzing...
          </>
        ) : (
          'Analyze Thesis'
        )}
      </button>
    </div>
  );
}