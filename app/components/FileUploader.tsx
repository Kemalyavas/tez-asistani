'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle, Coins, Zap, CheckCircle, FileText, Brain, BarChart3, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_COSTS, getAnalysisTier } from '../lib/pricing';

// Report language options
export type ReportLanguage = 'tr' | 'en' | 'auto';

const LANGUAGE_OPTIONS: { value: ReportLanguage; label: string; flag: string; description: string }[] = [
  { value: 'auto', label: 'Otomatik Tespit', flag: '🔄', description: 'Tez diliyle eşleştir' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷', description: 'Türkçe rapor' },
  { value: 'en', label: 'English', flag: '🇬🇧', description: 'İngilizce rapor' },
];

interface FileUploaderProps {
  onAnalysisComplete?: (result: any) => void;
}

type AnalysisStep = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'finalizing' | 'complete' | 'error';

const ANALYSIS_STEPS = [
  { id: 'uploading', label: 'Dosya yükleniyor', icon: Upload },
  { id: 'processing', label: 'Belge işleniyor', icon: FileText },
  { id: 'analyzing', label: 'Yapay Zeka Analizi', icon: Brain },
  { id: 'finalizing', label: 'Rapor oluşturuluyor', icon: BarChart3 },
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
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>('auto');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTime = useRef<number | null>(null);
  const MAX_POLLING_TIME_MS = 5 * 60 * 1000; // 5 dakika maksimum bekleme
  
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

      // PDF için gerçek sayfa sayısını almaya çalış
      let estimatedPagesFromSize = 0;

      if (uploadedFile.type === 'application/pdf') {
        try {
          // PDF'in ilk kısmını oku ve sayfa sayısını bul
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const text = new TextDecoder('latin1').decode(uint8Array);

          // PDF'teki /Count değerini bul (sayfa sayısı)
          const countMatch = text.match(/\/Count\s+(\d+)/g);
          if (countMatch && countMatch.length > 0) {
            // En büyük Count değerini al (genellikle toplam sayfa sayısı)
            const counts = countMatch.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
            estimatedPagesFromSize = Math.max(...counts);
          }

          // Eğer bulunamadıysa boyuttan tahmin et
          if (estimatedPagesFromSize === 0) {
            // PDF: ortalama 25KB per sayfa (görsel içeriğe göre değişir)
            estimatedPagesFromSize = Math.ceil(uploadedFile.size / 25000);
          }
        } catch (e) {
          // Hata durumunda boyuttan tahmin et
          estimatedPagesFromSize = Math.ceil(uploadedFile.size / 25000);
        }
      } else {
        // DOCX: ortalama 10KB per sayfa
        estimatedPagesFromSize = Math.ceil(uploadedFile.size / 10000);
      }

      // Minimum 1, maksimum 500 sayfa
      estimatedPagesFromSize = Math.max(1, Math.min(500, estimatedPagesFromSize));
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
      // Timeout kontrolü - 5 dakikadan fazla bekleme
      if (pollingStartTime.current && Date.now() - pollingStartTime.current > MAX_POLLING_TIME_MS) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setCurrentStep('error');
        setStatusMessage('Analiz zaman aşımına uğradı. Lütfen tekrar deneyin veya destek ile iletişime geçin.');
        toast.error('Analiz zaman aşımına uğradı. Analiz başarısız olduysa kredileriniz iade edilecektir.');
        setLoading(false);
        return;
      }

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
        setStatusMessage('Analiz tamamlandı!');
        await refreshCredits();

        toast.success('Analiz tamamlandı! Rapora yönlendiriliyorsunuz...');
        setLoading(false);

        // Otomatik yönlendirme - 1.5 saniye sonra rapora git
        setTimeout(() => {
          router.push(`/analyses/${docId}`);
        }, 1500);

      } else if (data.status === 'failed') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        setCurrentStep('error');
        setStatusMessage('Analiz başarısız oldu. Kredileriniz iade edildi.');
        toast.error('Analiz başarısız oldu. Lütfen tekrar deneyin.');
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
      toast.error('Lütfen önce giriş yapın');
      router.push('/auth');
      return;
    }

    // Credit check
    if (currentCredits < estimatedCredits) {
      toast.error(`Yetersiz kredi. Bu analiz için ${estimatedCredits} kredi gerekiyor.`);
      router.push('/pricing');
      return;
    }

    setLoading(true);
    setCurrentStep('uploading');
    setStatusMessage('Dosyanız yükleniyor...');

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
      setStatusMessage('Belge işleniyor...');

      // Step 2: Start analysis (returns immediately with document ID)
      const response = await fetch('/api/analyze/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: uploadData.path,
          fileName: file.name,
          reportLanguage: reportLanguage, // 'tr', 'en', or 'auto'
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
          toast.error(`Yetersiz kredi. ${data.creditsRequired} kredi gerekiyor.`);
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
      setStatusMessage('Yapay zeka tezinizi analiz ediyor...');

      // Start polling for status updates (5 second interval to reduce DB load)
      pollingStartTime.current = Date.now(); // Polling başlangıç zamanını kaydet
      pollingRef.current = setInterval(() => {
        pollAnalysisStatus(docId);
      }, 5000); // Poll every 5 seconds (max 5 minutes)

      // Also trigger the actual analysis in background
      fetch('/api/analyze/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          filePath: uploadData.path,
          fileName: file.name,
          reportLanguage: reportLanguage, // 'tr', 'en', or 'auto'
        }),
      }).catch(err => {
        console.error('Background analysis error:', err);
        // Don't throw - polling will catch the failure status
      });

    } catch (error: any) {
      setCurrentStep('error');
      setStatusMessage(error.message || 'Bir hata oluştu');
      toast.error(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
                Krediniz: <strong className="text-lg">{creditsLoading ? '...' : currentCredits}</strong>
              </span>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition flex items-center"
            >
              <Zap className="h-4 w-4 mr-1" />
              Kredi Satın Al
            </button>
          </div>
          {file && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">
                  Tahmini: ~{estimatedPages} sayfa → <strong>{estimatedCredits} kredi</strong>
                </span>
                <span className={`font-medium ${currentCredits >= estimatedCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {currentCredits >= estimatedCredits ? '✓ Yeterli' : '✗ Daha fazla kredi gerekiyor'}
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
              Tezinizi analiz etmek için <button onClick={() => router.push('/auth')} className="font-bold underline">giriş yapın</button>.
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
          <p className="text-blue-600">Dosyanızı buraya bırakın...</p>
        ) : (
          <div>
            <p className="text-gray-700 mb-2">
              Tez dosyanızı sürükleyip bırakın veya seçmek için tıklayın
            </p>
            <p className="text-sm text-gray-500">PDF veya DOCX (Maks. 10MB)</p>
          </div>
        )}
      </div>

      {file && (
        <div className="space-y-4">
          {/* Selected File */}
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

          {/* Report Language Selector */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Globe className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium text-indigo-900">Rapor Dili</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setReportLanguage(option.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    reportLanguage === option.value
                      ? 'border-indigo-500 bg-white shadow-sm'
                      : 'border-transparent bg-white/50 hover:bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.flag}</span>
                    <div>
                      <p className={`font-medium text-sm ${
                        reportLanguage === option.value ? 'text-indigo-700' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-indigo-600/70">
              💡 Otomatik tespit, tezinizi analiz edip raporu aynı dilde oluşturur
            </p>
          </div>
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
                  ? 'Yapay zeka analizi belge boyutuna göre 1-3 dakika sürebilir'
                  : 'Lütfen bekleyin...'}
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
                Farklı bir dosyayla tekrar dene
              </button>
            </div>
          )}

          {/* Success state - Show button to go to report */}
          {currentStep === 'complete' && analysisId && (
            <div className="mt-4 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Analiz Tamamlandı!</h3>
                <p className="text-green-700 mb-4">Teziniz başarıyla analiz edildi. Detaylı raporu görüntülemek için aşağıdaki butona tıklayın.</p>
                <button
                  onClick={() => router.push(`/analyses/${analysisId}`)}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analiz Raporunu Görüntüle
                </button>
              </div>
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
            {currentStep === 'uploading' ? 'Yükleniyor...' :
             currentStep === 'processing' ? 'İşleniyor...' :
             currentStep === 'analyzing' ? 'Analiz ediliyor...' :
             currentStep === 'finalizing' ? 'Tamamlanıyor...' :
             'Lütfen bekleyin...'}
          </>
        ) : (
          'Tez Analiz Et'
        )}
      </button>
    </div>
  );
}