// Multi-Agent Sistem Tip Tanımları

export type AgentModel = 'flash' | 'pro' | 'claude-sonnet';

export type SeverityLevel = 'critical' | 'major' | 'minor';

export interface Issue {
  severity: SeverityLevel;
  category: string;
  description: string;
  location?: string;
  suggestion?: string;
  example?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  model: AgentModel;
  weight: number;
  systemPrompt: string;
  evaluationCriteria: string[];
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  model: AgentModel;
  weight: number;
  score: number;
  subScores?: Record<string, number>;
  issues: Issue[];
  strengths: string[];
  feedback: string;
  processingTimeMs?: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  error?: string;
}

export interface AnalysisContext {
  text: string;
  wordCount: number;
  pageCount: number;
  language: 'tr' | 'en' | 'mixed';
  academicLevel: 'lisans' | 'yuksek_lisans' | 'doktora' | 'unknown';
  fieldOfStudy: string;
  sections: Array<{
    type: string;
    startIndex: number;
    title: string;
  }>;
  references: {
    totalCount: number;
    recentCount: number;
  };
}

export interface CategoryScore {
  score: number;
  feedback: string;
  subScores?: Record<string, number>;
  issues: Issue[];
  strengths: string[];
}

export interface FinalAnalysisResult {
  overallScore: number;
  grade: {
    letter: string;
    label: string;
    color: string;
  };
  categoryScores: {
    structure: CategoryScore;
    methodology: CategoryScore;
    writing_quality: CategoryScore;
    references: CategoryScore;
    originality?: CategoryScore;
  };
  issues: {
    critical: Issue[];
    major: Issue[];
    minor: Issue[];
    total: number;
  };
  strengths: string[];
  recommendations: string[];
  immediateActions: string[];
  metadata: {
    wordCount: number;
    pageCount: number;
    language: string;
    academicLevel: string;
    fieldOfStudy: string;
    referenceCount: number;
    recentReferenceCount: number;
  };
  analysisTier: 'basic' | 'standard' | 'comprehensive';
  crossValidated: boolean;
  analyzedAt: string;
}

// Not skalası
export const GRADE_SCALE = {
  'A+': { min: 95, max: 100, label: 'Mükemmel', color: '#10B981' },
  'A':  { min: 90, max: 94,  label: 'Çok İyi', color: '#34D399' },
  'A-': { min: 85, max: 89,  label: 'İyi', color: '#6EE7B7' },
  'B+': { min: 80, max: 84,  label: 'Ortanın Üstü', color: '#FCD34D' },
  'B':  { min: 75, max: 79,  label: 'Orta', color: '#FBBF24' },
  'B-': { min: 70, max: 74,  label: 'Kabul Edilebilir', color: '#F59E0B' },
  'C+': { min: 65, max: 69,  label: 'Zayıf', color: '#F97316' },
  'C':  { min: 60, max: 64,  label: 'Yetersiz', color: '#EF4444' },
  'F':  { min: 0,  max: 59,  label: 'Başarısız', color: '#DC2626' },
} as const;

export function getGrade(score: number): { letter: string; label: string; color: string } {
  for (const [letter, grade] of Object.entries(GRADE_SCALE)) {
    if (score >= grade.min && score <= grade.max) {
      return { letter, label: grade.label, color: grade.color };
    }
  }
  return { letter: 'F', label: 'Başarısız', color: '#DC2626' };
}
