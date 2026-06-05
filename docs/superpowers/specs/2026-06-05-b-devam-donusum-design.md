# B-devam: Dönüşüm (Conversion) — Tasarım Dokümanı

Tarih: 2026-06-05
Durum: Onaylandı (tasarım), implementation planı bekliyor

## Amaç

Ziyaretçi → kayıtlı kullanıcı → tekrar-kullanan dönüşümünü artırmak; profesyonellik korunarak. Üç bağımsız alt-iş.

---

## İş 1 — Girişsiz deneme (CitationFormatter / atıf aracı)

### Gerekçe
Landing "Ücretsiz Dene" vaadi veriyor ama üç araç da `disabled={!user}` ile giriş duvarı koyuyor — vaat/deneyim çelişkisi. Atıf aracı girişsiz açmak için en uygun: en ucuz (gpt-4o-mini, max_tokens 300), anında değer, dosya/oturum gerektirmez.

### Backend — `app/api/format-citation/route.ts`
- Auth artık **zorunlu değil**. İki yol:
  - **Girişli kullanıcı:** mevcut akış aynen korunur (kredi düş, admin bypass, AI hata → kredi iade).
  - **Girişsiz kullanıcı:** kredi düşmez; bunun yerine anonim kota:
    - IP başına **günde 3 deneme**. Ayrı Upstash sliding-window limiter, prefix `ratelimit:citation-anon`, pencere `24 h`, max `3`.
    - **Fail-CLOSED:** Redis erişilemez/hata ise girişsiz istek **reddedilir** (`503` benzeri, mesaj: "Ücretsiz deneme şu an kullanılamıyor, üye olun"). Böylece Upstash production'da yoksa bile sınırsız ücretsiz AI çağrısı (abuse) imkânsız. **Kayıtlı akış bu fail-closed kuralından etkilenmez** — o auth + kredi ile korunur.
- Korunan mevcut güvenlikler: 5000 karakter source cap, 20/dk genel IP limiti (`citation_${ip}`), sabit sistem promptu.
- Response: girişsiz başarıda `{ formatted, remainingFree: <kalan_anonim_hak> }`. Girişli başarıda mevcut `{ formatted, creditsUsed, remainingCredits }`.
- Kota aşımı (girişsiz, 3/3 dolu): `429`/`402` benzeri net mesaj + kayıt yönlendirmesi sinyali.

### Frontend — `app/components/CitationFormatter.tsx`
- `disabled={!user}` ve "Giriş Yap" kilidi kalkar.
- Girişsizken:
  - Buton: "Ücretsiz Dene" (kalan hak gösterimi mümkünse).
  - Başarılı sonuç gösterilir (gerçek AI çıktısı).
  - Sonuç sonrası / kota dolunca: yumuşak kayıt CTA ("Sınırsız formatlama + atıf geçmişi için üye ol" → `/auth?mode=signup`).
- Girişliyken: mevcut kredi-bilgisi davranışı aynen korunur.
- Landing'deki "Ücretsiz Dene" CTA bu aracı hedefler (scroll/yönlendirme).

### Edge-case / kabul edilen ödünler
- VPN/IP rotation ile limit aşımı: günlük 3 + ihmal edilebilir gpt-4o-mini maliyeti → kabul edilebilir.
- NAT (üniversite/kurum aynı IP): birden çok kullanıcı tek IP, kota erken dolabilir; girişsiz akış "tadımlık" olduğundan ve kayıt teşvik edildiğinden kabul edilebilir ödün.

---

## İş 2 — Auth iyileştirme

### `app/components/Auth.tsx`
- **`?mode=signup` desteği:** açılışta `useSearchParams` ile `mode` okunur; `signup` ise `isSignUp` başlangıçta `true`. (Open-redirect guard'lı mevcut `?redirect=` korunur.)
- **Kullanıcı adı opsiyonel:** `validateForm`'daki username zorunluluğu kaldırılır. Kayıtta boşsa `email.split('@')[0]` türetilir ve `data: { username, display_name }` olarak gönderilir. UI'da alan "(opsiyonel)" etiketiyle kalır; `required` kalkar.
- **Google ile giriş:** form üstüne "Google ile devam et" butonu + "veya" ayracı. `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/confirm veya redirect param } })`.
  - ⚠️ **Manuel kurulum gerekiyor (Kemal):** Supabase Dashboard → Authentication → Providers → Google enable; Google Cloud Console → OAuth 2.0 Client ID/Secret + authorized redirect URI (`https://<supabase-ref>.supabase.co/auth/v1/callback`). Kod tarafı hazır bırakılır; bu adımlar tamamlanana kadar Google butonu hata verir → ya kurulum tamamlanır ya da buton geçici gizlenir. Net adım listesi teslim sırasında verilir.

### Linkler
- Navbar (desktop + mobil) ve landing'deki "Kayıt ol / Giriş Yap / Kayıt Ol" çağrıları yeni kullanıcı için `/auth?mode=signup`'a yönlendirir (kayıt-öncelikli).

---

## İş 3 — Rapor → tekrar analiz CTA

### `app/analyses/[id]/AnalysisDetailContent.tsx`
- Rapor içeriğinin sonuna bir CTA bölümü: "Eksikleri düzelttin mi? Gözden geçirilmiş tezini tekrar analiz et" → yeni analiz akışına (`/tez-analizi` veya ana sayfa `#app`) yönlendirir.
- Raporun mevcut "birden fazla analiz turu daha iyi sonuç verir" değer mesajıyla tutarlı; tekrar-gelir / tekrar-kullanım köprüsü.
- Sadece `analyzed` durumundaki raporlarda gösterilir.

---

## Kapsam dışı (YAGNI)
- FileUploader ve AbstractGenerator girişsiz açılmaz (ağır/maliyetli; tek "tadımlık" araç yeterli).
- Dark mode.
- format-citation backend genel rate-limit revizyonu (mevcut 20/dk + 5000 cap yeterli).
- Anonim kullanım analitiği/funnel ölçümü (ayrı iş).

## Doğrulama planı
- `npm run build` temiz.
- Girişsiz: kota 3 çalışıyor, 4. istek reddediliyor; Redis-down simülasyonunda fail-closed.
- Girişli: mevcut kredi akışı bozulmamış (regresyon).
- `?mode=signup` açılışta kayıt modu; username boş bırakılınca kayıt başarılı + türetilmiş username.
- Rapor CTA yeni analize yönlendiriyor.
- Canlı Chrome görsel kontrol (admin oturumu) + deploy success.
