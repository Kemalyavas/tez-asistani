'use client';

/**
 * Admin yönetimi için gizli utility fonksiyonları
 * Bu dosyanın içeriği yalnızca yönetici erişimine yöneliktir
 */

// Güvenlik için admin ID'si kodda hardcoded olarak saklıdır
// Bu değeri kendi Supabase kullanıcı ID'nizle değiştirin
const ADMIN_USER_IDS = [
  // Ana admin kullanıcı ID'si (sizin kullanıcı ID'niz ile değiştirin)
  process.env.ADMIN_USER_ID || 'buraya_sizin_kullanıcı_id_nizi_yazın'
];

/**
 * Kullanıcı ID'sinin admin olup olmadığını kontrol eder
 * @param userId Kontrol edilecek kullanıcı ID'si
 * @returns Kullanıcının admin olup olmadığı
 */
export const isAdmin = (userId: string | undefined): boolean => {
  if (!userId) return false;
  
  // Listenin içinde ID varsa admin olarak işaretle
  return ADMIN_USER_IDS.includes(userId);
};
