import { Client } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// QStash istemcisi - background job'lar için
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Redis istemcisi - state management ve caching için
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter - Upstash Redis tabanlı (dağıtık)
export const analysisRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 15 dakikada 5 analiz
  analytics: true,
  prefix: 'ratelimit:analysis',
});

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // Dakikada 60 istek
  analytics: true,
  prefix: 'ratelimit:api',
});

// Analiz tier'ları
export type AnalysisTier = 'basic' | 'standard' | 'comprehensive';

// Job tipi
export interface AnalysisJob {
  documentId: string;
  userId: string;
  filePath: string;
  fileName: string;
  analysisTier: AnalysisTier;
  step: number;
  totalSteps: number;
  metadata?: Record<string, unknown>;
}

// Job durumları
export interface JobStatus {
  documentId: string;
  step: number;
  totalSteps: number;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Pipeline adımları
export const PIPELINE_STEPS = {
  EXTRACT_TEXT: { step: 1, name: 'Metin Çıkarma', duration: 30 },
  PRE_ANALYZE: { step: 2, name: 'Ön Analiz', duration: 20 },
  DEEP_ANALYZE: { step: 3, name: 'Derinlemesine Analiz', duration: 120 },
  CROSS_VALIDATE: { step: 4, name: 'Çapraz Doğrulama', duration: 60 },
  GENERATE_REPORT: { step: 5, name: 'Rapor Oluşturma', duration: 30 },
} as const;

// Toplam adım sayısı (tier'a göre)
export function getTotalSteps(tier: AnalysisTier): number {
  switch (tier) {
    case 'basic':
      return 3; // Extract, Pre-analyze, Report
    case 'standard':
      return 4; // Extract, Pre-analyze, Deep-analyze, Report
    case 'comprehensive':
      return 5; // Tüm adımlar
  }
}

// Analiz job'unu kuyruğa ekle
export async function enqueueAnalysis(params: {
  documentId: string;
  userId: string;
  filePath: string;
  fileName: string;
  analysisTier: AnalysisTier;
}): Promise<{ messageId: string }> {
  const totalSteps = getTotalSteps(params.analysisTier);

  const job: AnalysisJob = {
    ...params,
    step: 1,
    totalSteps,
  };

  // İlk adım: Metin çıkarma
  const result = await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/extract-text`,
    body: job,
    retries: 3,
    callback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/callback`,
    failureCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/failure`,
  });

  // Job durumunu Redis'e kaydet
  await setJobStatus(params.documentId, {
    documentId: params.documentId,
    step: 1,
    totalSteps,
    stepName: PIPELINE_STEPS.EXTRACT_TEXT.name,
    status: 'pending',
    progress: 0,
  });

  return { messageId: result.messageId };
}

// Sonraki adıma geç
export async function enqueueNextStep(
  currentJob: AnalysisJob,
  nextStepUrl: string
): Promise<{ messageId: string }> {
  const nextJob: AnalysisJob = {
    ...currentJob,
    step: currentJob.step + 1,
  };

  const result = await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}${nextStepUrl}`,
    body: nextJob,
    retries: 3,
    callback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/callback`,
    failureCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/failure`,
  });

  return { messageId: result.messageId };
}

// Job durumunu kaydet
export async function setJobStatus(
  documentId: string,
  status: JobStatus
): Promise<void> {
  await redis.set(`job:status:${documentId}`, JSON.stringify(status), {
    ex: 3600, // 1 saat TTL
  });
}

// Job durumunu al
export async function getJobStatus(
  documentId: string
): Promise<JobStatus | null> {
  const status = await redis.get<string>(`job:status:${documentId}`);
  if (!status) return null;
  return typeof status === 'string' ? JSON.parse(status) : status;
}

// Job sonucunu kaydet (geçici)
export async function setJobResult(
  documentId: string,
  step: number,
  result: unknown
): Promise<void> {
  await redis.set(`job:result:${documentId}:${step}`, JSON.stringify(result), {
    ex: 3600, // 1 saat TTL
  });
}

// Job sonucunu al
export async function getJobResult<T>(
  documentId: string,
  step: number
): Promise<T | null> {
  const result = await redis.get<string>(`job:result:${documentId}:${step}`);
  if (!result) return null;
  return typeof result === 'string' ? JSON.parse(result) : result;
}

// Job'u temizle
export async function cleanupJob(documentId: string): Promise<void> {
  const keys = await redis.keys(`job:*:${documentId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// QStash signature doğrulama
export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  try {
    const receiver = new (await import('@upstash/qstash')).Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    return await receiver.verify({
      signature,
      body,
    });
  } catch {
    return false;
  }
}
