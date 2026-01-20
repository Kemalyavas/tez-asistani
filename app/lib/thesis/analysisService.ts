// app/lib/thesis/analysisService.ts
// ============================================================================
// Thesis Analysis Service - Multi-Pass RAG-Based Analysis
// ============================================================================

import anthropic from '../anthropic';
import openai from '../openai';
import { ThesisChunk, SectionType, analyzeThesisStructure } from './chunkingService';

// ============================================================================
// Types
// ============================================================================

export interface AnalysisResult {
  overallScore: number;
  gradeCategory: 'Excellent' | 'Good' | 'Average' | 'Needs Work' | 'Poor';
  summary: string;
  
  categoryScores: {
    structure: CategoryScore;
    methodology: CategoryScore;
    writingQuality: CategoryScore;
    references: CategoryScore;
  };
  
  criticalIssues: Issue[];
  majorIssues: Issue[];
  minorIssues: Issue[];
  
  strengths: string[];
  recommendations: string[];
  immediateActions: string[];
  
  metadata: {
    analysisType: 'basic' | 'standard' | 'comprehensive';
    totalChunks: number;
    totalTokens: number;
    sectionsFound: SectionType[];
    missingEssentialSections: SectionType[];
    processingTime: number;
  };
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  details: string[];
}

export interface Issue {
  title: string;
  description: string;
  impact: 'critical' | 'major' | 'minor';
  section?: SectionType;
  solution: string;
  example?: string;
}

export type AnalysisType = 'basic' | 'standard' | 'comprehensive';

// ============================================================================
// Analysis Prompts
// ============================================================================

const SYSTEM_PROMPT = `You are a senior academic thesis reviewer with 20+ years of experience evaluating theses according to YÖK (Turkish Higher Education Council) standards and international academic best practices.

Your evaluation should be:
- Objective and evidence-based
- Constructive with actionable suggestions
- Aligned with academic writing standards
- Sensitive to both Turkish and English thesis conventions

Respond ONLY with valid JSON matching the requested schema.`;

const STRUCTURE_ANALYSIS_PROMPT = `Analyze the STRUCTURE of this thesis content.

Evaluate:
1. Chapter/section organization and logical flow
2. Abstract quality and alignment with content
3. Introduction-conclusion coherence
4. Hypothesis/research question clarity
5. Table of contents accuracy (if visible)

Rate structure from 0-25 points.

Respond with JSON:
{
  "score": <0-25>,
  "feedback": "<2-3 sentence summary>",
  "details": ["<specific finding 1>", "<specific finding 2>", ...],
  "issues": [
    {
      "title": "<short title>",
      "description": "<detailed description>",
      "impact": "critical|major|minor",
      "solution": "<specific fix>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}`;

const METHODOLOGY_ANALYSIS_PROMPT = `Analyze the METHODOLOGY of this thesis content.

Evaluate:
1. Research design appropriateness
2. Sample size and selection justification
3. Data collection methods validity
4. Analysis techniques appropriateness
5. Reproducibility and transparency

Rate methodology from 0-25 points.

Respond with JSON:
{
  "score": <0-25>,
  "feedback": "<2-3 sentence summary>",
  "details": ["<specific finding 1>", "<specific finding 2>", ...],
  "issues": [
    {
      "title": "<short title>",
      "description": "<detailed description>",
      "impact": "critical|major|minor",
      "solution": "<specific fix>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}`;

const WRITING_QUALITY_PROMPT = `Analyze the WRITING QUALITY of this thesis content.

Evaluate:
1. Academic language and clarity
2. Argumentation strength and logic
3. Critical analysis depth
4. Terminology consistency
5. Grammar and spelling (note language: Turkish/English)

Rate writing quality from 0-25 points.

Respond with JSON:
{
  "score": <0-25>,
  "feedback": "<2-3 sentence summary>",
  "details": ["<specific finding 1>", "<specific finding 2>", ...],
  "issues": [
    {
      "title": "<short title>",
      "description": "<detailed description>",
      "impact": "critical|major|minor",
      "solution": "<specific fix>",
      "example": "<example from text if applicable>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}`;

const REFERENCES_ANALYSIS_PROMPT = `Analyze the REFERENCES and CITATIONS of this thesis content.

Evaluate:
1. Citation format consistency (APA 7/MLA/Chicago)
2. Source recency and relevance
3. Source diversity (journals, books, etc.)
4. Citation-reference list alignment
5. Plagiarism indicators (inconsistent style, abrupt changes)

Rate references from 0-25 points.

Respond with JSON:
{
  "score": <0-25>,
  "feedback": "<2-3 sentence summary>",
  "details": ["<specific finding 1>", "<specific finding 2>", ...],
  "issues": [
    {
      "title": "<short title>",
      "description": "<detailed description>",
      "impact": "critical|major|minor",
      "solution": "<specific fix>",
      "example": "<citation example if applicable>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}`;

const SYNTHESIS_PROMPT = `Based on the individual category analyses provided, synthesize a final thesis evaluation.

Category Analyses:
{categoryAnalyses}

Create a comprehensive summary that:
1. Provides an overall assessment (0-100 score)
2. Determines grade category (Excellent/Good/Average/Needs Work/Poor)
3. Lists the top 3-5 immediate actions
4. Provides 3-5 key recommendations
5. Writes a 3-4 sentence executive summary

Respond with JSON:
{
  "overallScore": <0-100>,
  "gradeCategory": "Excellent|Good|Average|Needs Work|Poor",
  "summary": "<3-4 sentence executive summary>",
  "immediateActions": ["<action 1>", "<action 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`;

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Select representative chunks for analysis
 */
function selectChunksForAnalysis(
  chunks: ThesisChunk[],
  analysisType: AnalysisType,
  targetSection?: SectionType
): ThesisChunk[] {
  const maxChunks = {
    basic: 5,
    standard: 15,
    comprehensive: 30
  }[analysisType];

  let selectedChunks: ThesisChunk[];

  if (targetSection) {
    // Get chunks from specific section
    selectedChunks = chunks.filter(c => c.sectionType === targetSection);
  } else {
    selectedChunks = chunks;
  }

  if (selectedChunks.length <= maxChunks) {
    return selectedChunks;
  }

  // Sample evenly from the chunks
  const step = selectedChunks.length / maxChunks;
  const sampled: ThesisChunk[] = [];
  
  for (let i = 0; i < maxChunks; i++) {
    const idx = Math.floor(i * step);
    sampled.push(selectedChunks[idx]);
  }

  return sampled;
}

/**
 * Build context from chunks
 */
function buildContext(chunks: ThesisChunk[], maxTokens: number = 8000): string {
  let context = '';
  let tokenCount = 0;

  for (const chunk of chunks) {
    if (tokenCount + chunk.tokenCount > maxTokens) break;
    
    context += `\n\n--- Section: ${chunk.sectionType} (Chunk ${chunk.index}) ---\n`;
    context += chunk.content;
    tokenCount += chunk.tokenCount;
  }

  return context;
}

/**
 * Call Claude for analysis (primary model for complex analysis)
 */
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<any> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error('No valid JSON in response');
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Call GPT-4 for analysis (fallback/secondary)
 */
async function callGPT4(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (content) {
      return JSON.parse(content);
    }
    throw new Error('No content in response');
  } catch (error) {
    console.error('GPT-4 API error:', error);
    throw error;
  }
}

/**
 * Analyze a specific category
 */
async function analyzeCategory(
  chunks: ThesisChunk[],
  category: 'structure' | 'methodology' | 'writingQuality' | 'references',
  analysisType: AnalysisType
): Promise<CategoryScore & { issues: Issue[]; strengths: string[] }> {
  const prompts = {
    structure: STRUCTURE_ANALYSIS_PROMPT,
    methodology: METHODOLOGY_ANALYSIS_PROMPT,
    writingQuality: WRITING_QUALITY_PROMPT,
    references: REFERENCES_ANALYSIS_PROMPT
  };

  // Select relevant sections for each category
  const sectionMap: Record<string, SectionType[]> = {
    structure: ['abstract', 'introduction', 'table_of_contents', 'conclusion'],
    methodology: ['methodology', 'results'],
    writingQuality: ['introduction', 'literature_review', 'discussion'],
    references: ['references', 'literature_review']
  };

  const relevantSections = sectionMap[category];
  let selectedChunks = chunks.filter(c => 
    relevantSections.includes(c.sectionType) || c.sectionType === 'unknown'
  );

  // If not enough chunks from target sections, use all
  if (selectedChunks.length < 3) {
    selectedChunks = chunks;
  }

  selectedChunks = selectChunksForAnalysis(selectedChunks, analysisType);
  const context = buildContext(selectedChunks);

  const userPrompt = `${prompts[category]}\n\nThesis Content:\n${context}`;

  try {
    // Try Claude first (better for nuanced academic analysis)
    const result = await callClaude(SYSTEM_PROMPT, userPrompt);
    
    return {
      score: result.score || 0,
      maxScore: 25,
      percentage: ((result.score || 0) / 25) * 100,
      feedback: result.feedback || 'Analysis completed',
      details: result.details || [],
      issues: (result.issues || []).map((i: any) => ({
        ...i,
        section: category as any
      })),
      strengths: result.strengths || []
    };
  } catch (error) {
    // Fallback to GPT-4
    console.warn(`Claude failed for ${category}, trying GPT-4`);
    
    try {
      const result = await callGPT4(SYSTEM_PROMPT, userPrompt);
      
      return {
        score: result.score || 0,
        maxScore: 25,
        percentage: ((result.score || 0) / 25) * 100,
        feedback: result.feedback || 'Analysis completed',
        details: result.details || [],
        issues: (result.issues || []).map((i: any) => ({
          ...i,
          section: category as any
        })),
        strengths: result.strengths || []
      };
    } catch (fallbackError) {
      console.error(`Both APIs failed for ${category}`);
      return {
        score: 0,
        maxScore: 25,
        percentage: 0,
        feedback: 'Analysis could not be completed',
        details: [],
        issues: [],
        strengths: []
      };
    }
  }
}

/**
 * Main thesis analysis function
 */
export async function analyzeThesis(
  chunks: ThesisChunk[],
  analysisType: AnalysisType
): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  // Analyze structure
  const structureInfo = analyzeThesisStructure(chunks);
  
  // Run category analyses in parallel (for speed)
  const [structure, methodology, writingQuality, references] = await Promise.all([
    analyzeCategory(chunks, 'structure', analysisType),
    analyzeCategory(chunks, 'methodology', analysisType),
    analyzeCategory(chunks, 'writingQuality', analysisType),
    analyzeCategory(chunks, 'references', analysisType)
  ]);

  // Collect all issues
  const allIssues = [
    ...structure.issues,
    ...methodology.issues,
    ...writingQuality.issues,
    ...references.issues
  ];

  const criticalIssues = allIssues.filter(i => i.impact === 'critical');
  const majorIssues = allIssues.filter(i => i.impact === 'major');
  const minorIssues = allIssues.filter(i => i.impact === 'minor');

  // Collect strengths
  const allStrengths = [
    ...structure.strengths,
    ...methodology.strengths,
    ...writingQuality.strengths,
    ...references.strengths
  ];

  // Synthesize final results
  const categoryAnalyses = JSON.stringify({
    structure: { score: structure.score, feedback: structure.feedback },
    methodology: { score: methodology.score, feedback: methodology.feedback },
    writingQuality: { score: writingQuality.score, feedback: writingQuality.feedback },
    references: { score: references.score, feedback: references.feedback },
    criticalIssuesCount: criticalIssues.length,
    majorIssuesCount: majorIssues.length
  }, null, 2);

  let synthesis;
  try {
    synthesis = await callClaude(
      SYSTEM_PROMPT,
      SYNTHESIS_PROMPT.replace('{categoryAnalyses}', categoryAnalyses)
    );
  } catch {
    // Fallback synthesis
    const totalScore = structure.score + methodology.score + writingQuality.score + references.score;
    synthesis = {
      overallScore: totalScore,
      gradeCategory: totalScore >= 85 ? 'Excellent' :
                     totalScore >= 70 ? 'Good' :
                     totalScore >= 55 ? 'Average' :
                     totalScore >= 40 ? 'Needs Work' : 'Poor',
      summary: `The thesis received a score of ${totalScore}/100. ${structure.feedback}`,
      immediateActions: criticalIssues.slice(0, 3).map(i => i.solution),
      recommendations: majorIssues.slice(0, 3).map(i => i.solution)
    };
  }

  const processingTime = Date.now() - startTime;

  return {
    overallScore: synthesis.overallScore,
    gradeCategory: synthesis.gradeCategory,
    summary: synthesis.summary,
    
    categoryScores: {
      structure: {
        score: structure.score,
        maxScore: 25,
        percentage: structure.percentage,
        feedback: structure.feedback,
        details: structure.details
      },
      methodology: {
        score: methodology.score,
        maxScore: 25,
        percentage: methodology.percentage,
        feedback: methodology.feedback,
        details: methodology.details
      },
      writingQuality: {
        score: writingQuality.score,
        maxScore: 25,
        percentage: writingQuality.percentage,
        feedback: writingQuality.feedback,
        details: writingQuality.details
      },
      references: {
        score: references.score,
        maxScore: 25,
        percentage: references.percentage,
        feedback: references.feedback,
        details: references.details
      }
    },
    
    criticalIssues,
    majorIssues,
    minorIssues,
    
    strengths: allStrengths.slice(0, 8),
    recommendations: synthesis.recommendations || [],
    immediateActions: synthesis.immediateActions || [],
    
    metadata: {
      analysisType,
      totalChunks: chunks.length,
      totalTokens: structureInfo.totalTokens,
      sectionsFound: structureInfo.sectionOrder,
      missingEssentialSections: structureInfo.missingEssentialSections,
      processingTime
    }
  };
}

/**
 * Quick analysis for basic tier (faster, cheaper)
 */
export async function quickAnalysis(
  text: string,
  pageCount: number
): Promise<AnalysisResult> {
  // For basic analysis, use a single comprehensive prompt
  const truncatedText = text.substring(0, 30000);
  
  const quickPrompt = `Analyze this thesis excerpt and provide a quick evaluation.

Thesis (first ${Math.min(pageCount, 30)} pages approximately):
${truncatedText}

Provide JSON response with:
{
  "overallScore": <0-100>,
  "gradeCategory": "Excellent|Good|Average|Needs Work|Poor",
  "summary": "<2-3 sentence summary>",
  "categoryScores": {
    "structure": { "score": <0-25>, "feedback": "<short feedback>" },
    "methodology": { "score": <0-25>, "feedback": "<short feedback>" },
    "writingQuality": { "score": <0-25>, "feedback": "<short feedback>" },
    "references": { "score": <0-25>, "feedback": "<short feedback>" }
  },
  "topIssues": [
    { "title": "<issue>", "impact": "critical|major|minor", "solution": "<fix>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "recommendations": ["<rec 1>", "<rec 2>"]
}`;

  const startTime = Date.now();
  
  try {
    const result = await callGPT4(SYSTEM_PROMPT, quickPrompt, 2500);
    
    return {
      overallScore: result.overallScore || 50,
      gradeCategory: result.gradeCategory || 'Average',
      summary: result.summary || 'Quick analysis completed.',
      
      categoryScores: {
        structure: {
          score: result.categoryScores?.structure?.score || 12,
          maxScore: 25,
          percentage: ((result.categoryScores?.structure?.score || 12) / 25) * 100,
          feedback: result.categoryScores?.structure?.feedback || '',
          details: []
        },
        methodology: {
          score: result.categoryScores?.methodology?.score || 12,
          maxScore: 25,
          percentage: ((result.categoryScores?.methodology?.score || 12) / 25) * 100,
          feedback: result.categoryScores?.methodology?.feedback || '',
          details: []
        },
        writingQuality: {
          score: result.categoryScores?.writingQuality?.score || 12,
          maxScore: 25,
          percentage: ((result.categoryScores?.writingQuality?.score || 12) / 25) * 100,
          feedback: result.categoryScores?.writingQuality?.feedback || '',
          details: []
        },
        references: {
          score: result.categoryScores?.references?.score || 12,
          maxScore: 25,
          percentage: ((result.categoryScores?.references?.score || 12) / 25) * 100,
          feedback: result.categoryScores?.references?.feedback || '',
          details: []
        }
      },
      
      criticalIssues: (result.topIssues || []).filter((i: any) => i.impact === 'critical').map((i: any) => ({
        ...i,
        description: i.title,
        section: 'unknown' as SectionType
      })),
      majorIssues: (result.topIssues || []).filter((i: any) => i.impact === 'major').map((i: any) => ({
        ...i,
        description: i.title,
        section: 'unknown' as SectionType
      })),
      minorIssues: (result.topIssues || []).filter((i: any) => i.impact === 'minor').map((i: any) => ({
        ...i,
        description: i.title,
        section: 'unknown' as SectionType
      })),
      
      strengths: result.strengths || [],
      recommendations: result.recommendations || [],
      immediateActions: (result.topIssues || []).slice(0, 3).map((i: any) => i.solution),
      
      metadata: {
        analysisType: 'basic',
        totalChunks: 1,
        totalTokens: Math.ceil(truncatedText.length / 4),
        sectionsFound: [],
        missingEssentialSections: [],
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Quick analysis error:', error);
    throw error;
  }
}
