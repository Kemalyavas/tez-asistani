import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Gemini API istemcisi
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Model konfigürasyonları
export const GEMINI_MODELS = {
  // Hızlı ve ekonomik model - yapı kontrolü, basit analizler (1M context)
  FLASH: 'gemini-2.5-flash',
  // En güçlü model - Gemini 3 Pro Preview (1M context, gelişmiş reasoning)
  PRO: 'gemini-3-pro-preview',
} as const;

// Güvenlik ayarları - akademik içerik için optimize
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Gemini Flash modeli - hızlı işlemler için
export function getGeminiFlash() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS.FLASH,
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });
}

// Gemini Pro modeli - detaylı analiz için
export function getGeminiPro() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS.PRO,
    safetySettings,
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 65536,
    },
  });
}

// JSON çıktısı için özel model
export function getGeminiProJSON() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS.PRO,
    safetySettings,
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 65536,
      responseMimeType: 'application/json',
    },
  });
}

// Gemini ile metin analizi
export async function analyzeWithGemini(
  model: 'flash' | 'pro',
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const gemini = options?.jsonMode
    ? getGeminiProJSON()
    : (model === 'flash' ? getGeminiFlash() : getGeminiPro());

  const chat = gemini.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `SYSTEM: ${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Anladım, bu rolde görevimi yerine getireceğim.' }],
      },
    ],
  });

  const result = await chat.sendMessage(userPrompt);
  const response = result.response;

  return response.text();
}

// Token sayısı hesaplama (yaklaşık)
export function estimateTokenCount(text: string): number {
  // Türkçe için karakter/token oranı yaklaşık 3.5
  return Math.ceil(text.length / 3.5);
}

// Model maliyeti hesaplama (USD, 1M token başına)
export const MODEL_COSTS = {
  [GEMINI_MODELS.FLASH]: {
    input: 0.075, // $0.075 per 1M input tokens
    output: 0.30, // $0.30 per 1M output tokens
  },
  [GEMINI_MODELS.PRO]: {
    input: 1.25, // $1.25 per 1M input tokens
    output: 5.00, // $5.00 per 1M output tokens
  },
} as const;

export function calculateCost(
  model: keyof typeof MODEL_COSTS,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

export default genAI;
