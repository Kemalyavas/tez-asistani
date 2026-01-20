/**
 * Admin yönetimi için utility fonksiyonları
 * Bu dosya hem client hem server-side'da çalışır
 */

// Admin kullanıcılar - sınırsız erişim
const ADMIN_USER_IDS = [
  '90bc0065-4115-4730-8c00-12c74b4f8748', // kemalyavaas@outlook.com
];

// Admin email'leri (yedek kontrol için)
const ADMIN_EMAILS = [
  'kemalyavaas@outlook.com',
];

/**
 * Kullanıcı ID'sinin admin olup olmadığını kontrol eder
 * @param userId Kontrol edilecek kullanıcı ID'si
 * @returns Kullanıcının admin olup olmadığı
 */
export const isAdmin = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
};

/**
 * Email'in admin olup olmadığını kontrol eder
 * @param email Kontrol edilecek email
 * @returns Email'in admin olup olmadığı
 */
export const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
