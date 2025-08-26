import { useState } from 'react'
import toast from 'react-hot-toast'

// Güvenli dosya türleri
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc']
}

// Maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Tehlikeli dosya uzantıları
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar', '.com',
  '.app', '.dmg', '.pkg', '.deb', '.rpm', '.msi', '.zip', '.rar', '.7z'
]

interface FileSecurityCheck {
  isValid: boolean
  error?: string
  sanitizedName?: string
}

export function validateFileSecurity(file: File): FileSecurityCheck {
  // 1. Dosya boyutu kontrolü
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB olmalıdır.`
    }
  }

  // 2. Dosya türü kontrolü
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: 'Sadece PDF ve Word (.docx, .doc) dosyaları kabul edilir.'
    }
  }

  // 3. Dosya uzantısı kontrolü
  const fileExtension = file.name.toLowerCase().split('.').pop()
  const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat()
  
  if (!fileExtension || !allowedExtensions.some(ext => ext === `.${fileExtension}`)) {
    return {
      isValid: false,
      error: 'Geçersiz dosya uzantısı.'
    }
  }

  // 4. Tehlikeli uzantı kontrolü
  if (DANGEROUS_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
    return {
      isValid: false,
      error: 'Bu dosya türü güvenlik nedeniyle kabul edilmez.'
    }
  }

  // 5. Dosya adı güvenlik kontrolü
  const sanitizedName = sanitizeFileName(file.name)
  if (sanitizedName.length === 0) {
    return {
      isValid: false,
      error: 'Geçersiz dosya adı.'
    }
  }

  // 6. İçerik türü double-check
  if (!file.type || file.type === 'application/octet-stream') {
    return {
      isValid: false,
      error: 'Dosya türü tespit edilemedi. Lütfen geçerli bir PDF veya Word dosyası seçin.'
    }
  }

  return {
    isValid: true,
    sanitizedName
  }
}

function sanitizeFileName(fileName: string): string {
  // Tehlikeli karakterleri temizle
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Tehlikeli karakterler
    .replace(/^\.+/, '_') // Başta nokta
    .replace(/\.+$/, '') // Sonda nokta
    .replace(/\s+/g, '_') // Boşluklar
    .substring(0, 255) // Maksimum uzunluk

  return sanitized
}

// Dosya okuma güvenlik wrapper'ı
export async function secureFileRead(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    // Güvenlik kontrolü
    const validation = validateFileSecurity(file)
    if (!validation.isValid) {
      reject(new Error(validation.error))
      return
    }

    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        // Basit malware kontrolü - sıfır byte kontrolü
        const bytes = new Uint8Array(reader.result)
        if (bytes.length === 0) {
          reject(new Error('Dosya boş veya bozuk görünüyor.'))
          return
        }

        // PDF magic number kontrolü
        if (file.type === 'application/pdf') {
          const pdfHeader = bytes.slice(0, 4)
          const pdfMagic = [0x25, 0x50, 0x44, 0x46] // %PDF
          if (!pdfMagic.every((byte, index) => byte === pdfHeader[index])) {
            reject(new Error('Dosya gerçek bir PDF dosyası değil.'))
            return
          }
        }

        // DOCX magic number kontrolü
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const zipHeader = bytes.slice(0, 4)
          const zipMagic = [0x50, 0x4B, 0x03, 0x04] // PK..
          if (!zipMagic.every((byte, index) => byte === zipHeader[index])) {
            reject(new Error('Dosya gerçek bir DOCX dosyası değil.'))
            return
          }
        }

        resolve(reader.result)
      } else {
        reject(new Error('Dosya okunamadı.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası.'))
    }

    // Timeout ekle (30 saniye)
    setTimeout(() => {
      reader.abort()
      reject(new Error('Dosya okuma zaman aşımı.'))
    }, 30000)

    reader.readAsArrayBuffer(file)
  })
}

// Hook for secure file handling
export function useSecureFileUpload() {
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = async (file: File): Promise<ArrayBuffer | null> => {
    setIsProcessing(true)
    
    try {
      // Güvenlik kontrolü ve dosya okuma
      const arrayBuffer = await secureFileRead(file)
      
      // Log the upload (optional - for monitoring)
      console.log(`Secure file processed: ${file.name}, Size: ${file.size}, Type: ${file.type}`)
      
      return arrayBuffer
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Dosya işlenirken hata oluştu.'
      toast.error(errorMessage)
      console.error('File security error:', error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processFile,
    isProcessing
  }
}
