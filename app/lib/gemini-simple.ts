import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Gemini API istemcisi
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Güvenlik ayarları - akademik içerik için
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Gemini Flash - hızlı işlemler (ekonomik, 1M context)
export function getGeminiFlash() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });
}

// Gemini 3 Pro - en gelişmiş reasoning (1M context)
export function getGeminiPro() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 32768,
    },
  });
}

// Basit analiz fonksiyonu
export async function analyzeWithGemini(
  prompt: string,
  useProModel: boolean = false
): Promise<string> {
  const model = useProModel ? getGeminiPro() : getGeminiFlash();

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// JSON çıktısı için
export async function analyzeWithGeminiJSON(
  prompt: string,
  useProModel: boolean = false
): Promise<unknown> {
  const response = await analyzeWithGemini(prompt, useProModel);

  // JSON'u bul ve parse et
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error('JSON parse error:', response);
      return null;
    }
  }
  return null;
}
