'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useUserLimits } from '../hooks/useUserLimits';

interface FileUploaderProps {
  onAnalysisComplete: (result: any) => void;
}

export default function FileUploader({ onAnalysisComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, usage, loading: userLoading, checkLimit, incrementUsage, refreshData } = useUserLimits();
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;

    // Giriş kontrolü
    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      router.push('/auth');
      return;
    }

    // Limit kontrolü - useUserLimits hook'unu kullan
    const limitCheck = checkLimit('thesis_analyses');
    if (!limitCheck.allowed) {
      toast.error(limitCheck.reason || 'Limit aşıldı');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analiz başarısız');
      }

      const data = await response.json();
      
      // Hook'tan usage'ı artır
      await incrementUsage('thesis_analyses');
      
      onAnalysisComplete(data);
      toast.success('Tez başarıyla analiz edildi!');
      
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Limit Göstergesi */}
      {user && usage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Plan: <strong>{usage.subscription_status === 'free' ? 'Ücretsiz' : usage.subscription_status === 'pro' ? 'Pro' : 'Expert'}</strong>
              </span>
            </div>
            <span className="text-sm text-blue-800">
              Kalan Hak: <strong>
                {usage.subscription_status === 'expert' ? 'Sınırsız' : 
                 usage.subscription_status === 'free' ? 
                 `${Math.max(0, 1 - usage.thesis_analyses)}/1` :
                 `${Math.max(0, 50 - usage.thesis_analyses)}/50`}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Giriş uyarısı */}
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Tez analizi için <button onClick={() => router.push('/auth')} className="font-bold underline">giriş yapmanız</button> gerekiyor.
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
          <p className="text-blue-600">Dosyayı buraya bırakın...</p>
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
            Analiz ediliyor...
          </>
        ) : (
          'Tezi Analiz Et'
        )}
      </button>
    </div>
  );
}