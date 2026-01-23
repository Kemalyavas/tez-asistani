'use client';

import React from 'react';
import { useAnalysisStatus } from '@/app/hooks/useAnalysisStatus';
import {
  FileText,
  Search,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

interface AnalysisProgressProps {
  documentId: string;
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
}

const STEP_ICONS = {
  1: FileText,
  2: Search,
  3: Brain,
  4: CheckCircle2,
  5: FileCheck,
};

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Tez dosyanız okunuyor ve metin çıkarılıyor...',
  2: 'Yapı analizi ve kaynak tespiti yapılıyor...',
  3: 'Çoklu AI ajanları detaylı analiz yapıyor...',
  4: 'Sonuçlar çapraz doğrulanıyor...',
  5: 'Rapor oluşturuluyor...',
};

export function AnalysisProgress({
  documentId,
  onComplete,
  onError,
}: AnalysisProgressProps) {
  const {
    status,
    documentStatus,
    isCompleted,
    isFailed,
    error,
    progressPercentage,
    estimatedRemaining,
  } = useAnalysisStatus(documentId);

  // Tamamlandığında callback çağır
  React.useEffect(() => {
    if (isCompleted && documentStatus?.overall_score !== null) {
      onComplete?.(documentStatus);
    }
  }, [isCompleted, documentStatus, onComplete]);

  // Hata durumunda callback çağır
  React.useEffect(() => {
    if (isFailed && error) {
      onError?.(error);
    }
  }, [isFailed, error, onError]);

  if (!status) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Analiz başlatılıyor...</span>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <XCircle className="w-8 h-8 text-red-500" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-700">Analiz Başarısız</h3>
            <p className="text-red-600 mt-1">{error || 'Bir hata oluştu'}</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-red-600">
          Krediniz otomatik olarak iade edildi. Lütfen tekrar deneyin veya destek ile iletişime geçin.
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-700">Analiz Tamamlandı!</h3>
            <p className="text-green-600 mt-1">
              Teziniz başarıyla analiz edildi. Sonuçları aşağıda görebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = status.step;
  const totalSteps = status.totalSteps;
  const CurrentIcon = STEP_ICONS[currentStep as keyof typeof STEP_ICONS] || Brain;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CurrentIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">{status.stepName}</h3>
            <p className="text-sm text-gray-500">
              Adım {currentStep} / {totalSteps}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
          {estimatedRemaining && estimatedRemaining > 0 && (
            <div className="text-xs text-gray-500">
              ~{Math.ceil(estimatedRemaining / 60)} dk kaldı
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-blue-400 opacity-50 animate-pulse rounded-full"
          style={{ width: `${Math.min(progressPercentage + 5, 100)}%` }}
        />
      </div>

      {/* Step Description */}
      <p className="text-sm text-gray-600 mb-6">
        {STEP_DESCRIPTIONS[currentStep] || 'İşlem devam ediyor...'}
      </p>

      {/* Steps Progress */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const StepIcon = STEP_ICONS[step as keyof typeof STEP_ICONS] || FileText;
          const isActive = step === currentStep;
          const isComplete = step < currentStep;
          const isPending = step > currentStep;

          return (
            <div
              key={step}
              className={`flex flex-col items-center ${
                step < totalSteps ? 'flex-1' : ''
              }`}
            >
              <div className="relative">
                {/* Connecting line */}
                {step < totalSteps && (
                  <div
                    className={`absolute top-1/2 left-full w-full h-0.5 -translate-y-1/2 ${
                      isComplete ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ width: 'calc(100% - 1rem)' }}
                  />
                )}

                {/* Step circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Step label */}
              <span
                className={`text-xs mt-2 text-center ${
                  isActive
                    ? 'text-blue-600 font-medium'
                    : isComplete
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Warning for long analysis */}
      {progressPercentage > 50 && progressPercentage < 90 && (
        <div className="mt-6 flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="ml-2 text-sm text-yellow-700">
            Analiz devam ediyor. Bu sayfa açık kalabilir veya daha sonra Dashboard'dan sonuçlara
            erişebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalysisProgress;
