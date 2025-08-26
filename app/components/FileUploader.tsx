'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface FileUploaderProps {
  onAnalysisComplete: (result: any) => void;
}

export default function FileUploader({ onAnalysisComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    checkUserAndLimits();
  }, []);

  const checkUserAndLimits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Kullanıcı limitlerini kontrol et
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (!userData) {
        // İlk kez giriş yapan kullanıcı için kayıt oluştur
        const { data: newUser } = await supabase
          .from('users')
          .insert([
            { 
              email: user.email,
              plan_type: 'free',
              analysis_count: 0,
              analysis_limit: 1
            }
          ])
          .select()
          .single();
          
        setUserLimits(newUser);
      } else {
        setUserLimits(userData);
      }
    }
  };

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

    // Limit kontrolü
    if (userLimits) {
      if (userLimits.plan_type === 'free' && userLimits.analysis_count >= userLimits.analysis_limit) {
        toast.error('Ücretsiz analiz hakkınız doldu. Pro plana yükseltebilirsiniz.');
        return;
      }
      
      if (userLimits.plan_type === 'pro' && userLimits.analysis_count >= 50) {
        toast.error('Aylık 50 analiz hakkınız doldu.');
        return;
      }
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

      if (!response.ok) throw new Error('Analiz başarısız');

      const data = await response.json();
      
      // Kullanım sayısını artır
      await supabase
        .from('users')
        .update({ analysis_count: (userLimits?.analysis_count || 0) + 1 })
        .eq('email', user.email);
      
      // Log kaydet
      await supabase
        .from('usage_logs')
        .insert([
          { user_id: user.id, action_type: 'analysis' }
        ]);
      
      onAnalysisComplete(data);
      toast.success('Tez başarıyla analiz edildi!');
      
      // Limitleri güncelle
      checkUserAndLimits();
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
      {user && userLimits && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Plan: <strong>{userLimits.plan_type === 'free' ? 'Ücretsiz' : userLimits.plan_type === 'pro' ? 'Pro' : 'Expert'}</strong>
              </span>
            </div>
            <span className="text-sm text-blue-800">
              Kalan Hak: <strong>
                {userLimits.plan_type === 'expert' ? 'Sınırsız' : 
                 userLimits.plan_type === 'free' ? 
                 `${userLimits.analysis_limit - userLimits.analysis_count}/1` :
                 `${50 - userLimits.analysis_count}/50`}
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