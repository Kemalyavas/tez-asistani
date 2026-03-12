/**
 * Admin yönetimi için utility fonksiyonları
 * Bu dosya hem client hem server-side'da çalışır
 */

// Admin kullanıcılar - environment variable'dan okunur (virgülle ayrılmış)
const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean);

// Admin email'leri (yedek kontrol için) - environment variable'dan okunur
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);

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
