import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF dosyasının metnini ve fiziksel sayfa sayısını birlikte çıkarır.
 * pdf-parse'ı dinamik olarak yükler (test modunu devre dışı bırakmak için
 * ana modül yerine doğrudan lib alt-yolu kullanılır).
 *
 * Geri dönüş:
 *   - text: PDF'in çıkarılmış düz metni
 *   - numPages: PDF metadata'sındaki gerçek fiziksel sayfa sayısı
 *     (metin-yoğunluğu tahmini DEĞİL — gerçek sayfa)
 */
export async function extractPdfData(
  buffer: Buffer
): Promise<{ text: string; numPages: number }> {
  try {
    // @ts-ignore - No type definitions available for pdf-parse/lib/pdf-parse.js
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse.default(buffer);
    return {
      text: data.text,
      numPages: typeof data.numpages === 'number' ? data.numpages : 0,
    };
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('PDF dosyası işlenirken hata oluştu');
  }
}

/**
 * Sadece metni çıkarır. Geriye uyumluluk için korunuyor;
 * yeni kullanımlar için extractPdfData tercih edilmeli.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { text } = await extractPdfData(buffer);
  return text;
}
