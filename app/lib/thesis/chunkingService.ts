// app/lib/thesis/chunkingService.ts
// ============================================================================
// Thesis Document Chunking Service
// Splits thesis documents into semantic chunks for RAG processing
// ============================================================================

import openai from '../openai';

export interface ThesisChunk {
  index: number;
  content: string;
  tokenCount: number;
  sectionType: SectionType;
  pageNumbers?: string;
  metadata: {
    startChar: number;
    endChar: number;
    hasHeading: boolean;
    headingText?: string;
  };
}

export type SectionType = 
  | 'cover'
  | 'abstract'
  | 'table_of_contents'
  | 'introduction'
  | 'literature_review'
  | 'methodology'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'references'
  | 'appendix'
  | 'unknown';

// Turkish and English section patterns
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  cover: [
    /^(kapak|cover|title\s*page)/i
  ],
  abstract: [
    /^(özet|abstract|summary|öz)\s*$/im,
    /^(özet|abstract|summary)\s*[:\-]/im
  ],
  table_of_contents: [
    /^(içindekiler|table\s*of\s*contents|contents)\s*$/im
  ],
  introduction: [
    /^(1\.?\s*)?(giriş|introduction|problem\s*statement)/im,
    /^(bölüm|chapter)\s*1\s*[:\-]?\s*(giriş|introduction)/im
  ],
  literature_review: [
    /^(2\.?\s*)?(literatür\s*taraması|literature\s*review|theoretical\s*framework|kuramsal\s*çerçeve)/im,
    /^(bölüm|chapter)\s*2/im,
    /^(ilgili\s*araştırmalar|related\s*work|background)/im
  ],
  methodology: [
    /^(3\.?\s*)?(yöntem|metodoloji|methodology|research\s*method|araştırma\s*yöntemi)/im,
    /^(bölüm|chapter)\s*3/im,
    /^(materyal\s*ve\s*yöntem|materials?\s*and\s*methods?)/im
  ],
  results: [
    /^(4\.?\s*)?(bulgular|results|findings|sonuçlar)/im,
    /^(bölüm|chapter)\s*4/im,
    /^(veri\s*analizi|data\s*analysis)/im
  ],
  discussion: [
    /^(5\.?\s*)?(tartışma|discussion|interpretation)/im,
    /^(bölüm|chapter)\s*5/im
  ],
  conclusion: [
    /^(6\.?\s*)?(sonuç|conclusion|concluding\s*remarks|sonuç\s*ve\s*öneriler)/im,
    /^(bölüm|chapter)\s*(5|6)/im,
    /^(recommendations|öneriler)/im
  ],
  references: [
    /^(kaynakça|kaynaklar|references|bibliography|works\s*cited)\s*$/im
  ],
  appendix: [
    /^(ekler|appendix|appendices)\s*$/im,
    /^(ek\s*[a-z0-9]|appendix\s*[a-z0-9])/im
  ],
  unknown: []
};

/**
 * Estimate token count for a string (rough approximation)
 * Average: 1 token ≈ 4 characters for English, ~3 for Turkish
 */
export function estimateTokenCount(text: string): number {
  // More accurate estimation considering Turkish
  const words = text.split(/\s+/).length;
  const chars = text.length;
  // Blend of word-based and char-based estimation
  return Math.ceil((words * 1.3 + chars / 3.5) / 2);
}

/**
 * Detect section type from text content
 */
export function detectSectionType(text: string): SectionType {
  const firstLines = text.substring(0, 500);
  
  for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (sectionType === 'unknown') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(firstLines)) {
        return sectionType as SectionType;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Find natural break points in text (paragraphs, sentences)
 */
function findBreakPoint(text: string, targetIndex: number, windowSize: number = 200): number {
  const start = Math.max(0, targetIndex - windowSize);
  const end = Math.min(text.length, targetIndex + windowSize);
  const window = text.substring(start, end);
  
  // Priority 1: Double newline (paragraph break)
  const paragraphBreak = window.lastIndexOf('\n\n');
  if (paragraphBreak !== -1 && paragraphBreak > windowSize / 2) {
    return start + paragraphBreak + 2;
  }
  
  // Priority 2: Single newline
  const lineBreak = window.lastIndexOf('\n');
  if (lineBreak !== -1 && lineBreak > windowSize / 3) {
    return start + lineBreak + 1;
  }
  
  // Priority 3: Sentence end (. ! ?)
  const sentenceEnd = window.search(/[.!?]\s+(?=[A-ZÇĞİÖŞÜ])/);
  if (sentenceEnd !== -1) {
    return start + sentenceEnd + 2;
  }
  
  // Fallback: use target index
  return targetIndex;
}

/**
 * Split thesis text into semantic chunks
 */
export function chunkThesisText(
  text: string,
  options: {
    maxTokensPerChunk?: number;
    overlapTokens?: number;
    preserveSections?: boolean;
  } = {}
): ThesisChunk[] {
  const {
    maxTokensPerChunk = 1500,
    overlapTokens = 150,
    preserveSections = true
  } = options;

  const chunks: ThesisChunk[] = [];
  
  // Approximate chars per chunk based on token estimate
  const charsPerToken = 3.5;
  const maxCharsPerChunk = Math.floor(maxTokensPerChunk * charsPerToken);
  const overlapChars = Math.floor(overlapTokens * charsPerToken);
  
  // Clean and normalize text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n');
  
  let currentPosition = 0;
  let chunkIndex = 0;
  let currentSection: SectionType = 'unknown';
  
  while (currentPosition < cleanedText.length) {
    // Determine chunk end position
    let endPosition = Math.min(currentPosition + maxCharsPerChunk, cleanedText.length);
    
    // If not at the end, find a natural break point
    if (endPosition < cleanedText.length) {
      endPosition = findBreakPoint(cleanedText, endPosition);
    }
    
    // Extract chunk content
    const chunkContent = cleanedText.substring(currentPosition, endPosition).trim();
    
    if (chunkContent.length > 0) {
      // Detect section type
      const detectedSection = detectSectionType(chunkContent);
      if (detectedSection !== 'unknown') {
        currentSection = detectedSection;
      }
      
      // Find if there's a heading in the first few lines
      const headingMatch = chunkContent.match(/^(.{1,100})\n/);
      
      chunks.push({
        index: chunkIndex,
        content: chunkContent,
        tokenCount: estimateTokenCount(chunkContent),
        sectionType: currentSection,
        metadata: {
          startChar: currentPosition,
          endChar: endPosition,
          hasHeading: !!headingMatch,
          headingText: headingMatch?.[1]?.trim()
        }
      });
      
      chunkIndex++;
    }
    
    // Move to next position with overlap
    currentPosition = endPosition - overlapChars;
    if (currentPosition <= currentPosition - maxCharsPerChunk) {
      // Prevent infinite loop
      currentPosition = endPosition;
    }
  }
  
  return chunks;
}

/**
 * Get embedding for a single text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000), // Limit input size
    dimensions: 1536
  });
  
  return response.data[0].embedding;
}

/**
 * Get embeddings for multiple chunks (batch processing)
 */
export async function getChunkEmbeddings(
  chunks: ThesisChunk[],
  batchSize: number = 10
): Promise<Map<number, number[]>> {
  const embeddings = new Map<number, number[]>();
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map(c => c.content.substring(0, 8000));
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 1536
      });
      
      response.data.forEach((item, idx) => {
        embeddings.set(batch[idx].index, item.embedding);
      });
    } catch (error) {
      console.error(`Embedding batch ${i / batchSize} failed:`, error);
      // Continue with other batches
    }
    
    // Small delay to respect rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

/**
 * Analyze thesis structure and detect sections
 */
export function analyzeThesisStructure(chunks: ThesisChunk[]): {
  sections: Map<SectionType, number[]>;
  sectionOrder: SectionType[];
  missingEssentialSections: SectionType[];
  totalTokens: number;
} {
  const sections = new Map<SectionType, number[]>();
  const sectionOrder: SectionType[] = [];
  let totalTokens = 0;
  
  const essentialSections: SectionType[] = [
    'abstract',
    'introduction',
    'methodology',
    'results',
    'conclusion',
    'references'
  ];
  
  for (const chunk of chunks) {
    totalTokens += chunk.tokenCount;
    
    if (!sections.has(chunk.sectionType)) {
      sections.set(chunk.sectionType, []);
      sectionOrder.push(chunk.sectionType);
    }
    sections.get(chunk.sectionType)!.push(chunk.index);
  }
  
  const foundSections = new Set(sectionOrder);
  const missingEssentialSections = essentialSections.filter(
    s => !foundSections.has(s)
  );
  
  return {
    sections,
    sectionOrder,
    missingEssentialSections,
    totalTokens
  };
}
