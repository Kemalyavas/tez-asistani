import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF dosyasının içeriğini çıkarmak için özel yardımcı fonksiyon
 * pdf-parse kütüphanesinin test modunu devre dışı bırakarak çalışır
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse'ı dinamik olarak import et
    // @ts-ignore - No type definitions available for pdf-parse/lib/pdf-parse.js
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
    
    // pdfParse modülünü doğrudan çağır, ana modülü kullanma
    const data = await pdfParse.default(buffer);
    
    return data.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('PDF dosyası işlenirken hata oluştu');
  }
}
