# B-devam (Dönüşüm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ziyaretçi→kayıt→tekrar-kullanım dönüşümünü artırmak: girişsiz atıf denemesi, kayıt-öncelikli auth (+Google, opsiyonel username), rapor sonu "tekrar analiz" köprüsü.

**Architecture:** Next.js 14 App Router. format-citation API route'u auth-opsiyonel yapılır; girişsiz istek Upstash sliding-window ile IP başına günde 3 ile sınırlanır (Redis erişilemezse fail-CLOSED, kayıtlı akış etkilenmez). Frontend giriş duvarları kaldırılır, yumuşak kayıt CTA'ları eklenir. Auth bileşenine ?mode=signup + Google OAuth + opsiyonel username.

**Tech Stack:** Next.js 14, TypeScript, Supabase auth-helpers, @upstash/ratelimit + @upstash/redis, Tailwind (primary=indigo), lucide-react, react-hot-toast. Prod: Vercel auto-deploy on push to `main`.

**Not (TDD yok):** Projede test framework yok (sadece dev/build/start/lint). Her task'ta doğrulama = `npm run build` (TS/derleme) + mantık incelemesi; davranışsal doğrulama deploy sonrası canlı Chrome/HTTP ile yapılır. Her task kendi commit'i.

**Git:** `git add` ile dosyaları AÇIKÇA ekle (asla `git add -A`/`.`). Commit footer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## Task 1: Girişsiz deneme — Backend (format-citation auth-opsiyonel + anonim kota)

**Files:**
- Modify: `app/lib/queue/qstash.ts` (yeni anonim limiter export)
- Modify: `app/api/format-citation/route.ts` (auth opsiyonel + anonim dal)

- [ ] **Step 1: qstash.ts'e anonim citation limiter ekle**

`app/lib/queue/qstash.ts` içinde mevcut `citationRateLimiter` tanımından (satır ~31-36) hemen SONRA ekle:

```typescript
// Girişsiz (anonim) ücretsiz atıf denemesi: IP başına günde 3.
// fail-closed kullanımı route tarafında (Redis hatasında deneme reddedilir).
export const citationAnonRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 d'),
  analytics: true,
  prefix: 'ratelimit:citation-anon',
});
```

- [ ] **Step 2: route.ts importuna anonim limiter'ı ekle**

`app/api/format-citation/route.ts` satır 5'teki import'u genişlet:

```typescript
import { rateLimit, getClientIP } from '../../lib/rateLimit';
import { citationAnonRateLimiter } from '../../lib/queue/qstash';
```

- [ ] **Step 3: Auth zorunluluğunu kaldır, anonim + kayıtlı dalları kur**

`app/api/format-citation/route.ts` içinde mevcut auth bloğunu (satır 60-106, `// Supabase auth check` yorumundan kredi kontrolü sonuna kadar) AŞAĞIDAKİ ile değiştir:

```typescript
    // Supabase auth — ARTIK ZORUNLU DEĞİL. Girişli: kredi düş. Girişsiz: günlük IP kotası.
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const isAnon = !user;

    let userIsAdmin = false;
    let result: any = null;
    let anonRemaining = 0;

    if (isAnon) {
      // Girişsiz ücretsiz deneme: fail-CLOSED günlük IP kotası.
      // Redis erişilemezse denemeyi REDDET (abuse engeli); kayıtlı akış bundan etkilenmez.
      let anonCheck;
      try {
        anonCheck = await citationAnonRateLimiter.limit(`anon_${clientIP}`);
      } catch (e) {
        console.error('[FormatCitation] anon ratelimit error, fail-closed:', e);
        return NextResponse.json(
          { error: 'Ücretsiz deneme şu an kullanılamıyor. Lütfen üye olun.', requireAuth: true },
          { status: 503 }
        );
      }
      if (!anonCheck.success) {
        return NextResponse.json(
          { error: 'Günlük ücretsiz deneme hakkınız doldu. Sınırsız formatlama için üye olun.', requireAuth: true, remainingFree: 0 },
          { status: 429 }
        );
      }
      anonRemaining = anonCheck.remaining;
    } else {
      // Admin bypass - skip credit deduction
      userIsAdmin = isAdmin(user.id);
      if (userIsAdmin) {
        console.log('[ADMIN] Credit check bypassed for user:', user.id);
        result = { success: true, new_balance: 999999 };
      } else {
        const { data: creditResult, error: creditError } = await supabase.rpc('use_credits', {
          p_user_id: user.id,
          p_amount: CREDITS_REQUIRED,
          p_action_type: ACTION_TYPE,
          p_description: `Format citation: ${format.toUpperCase()} - ${type}`
        });

        if (creditError) {
          console.error('Credit deduction error:', creditError);
          return NextResponse.json(
            { error: 'Failed to process credits' },
            { status: 500 }
          );
        }

        result = creditResult?.[0];
        if (!result?.success) {
          return NextResponse.json(
            {
              error: result?.error_message || 'Insufficient credits',
              creditsRequired: CREDITS_REQUIRED,
              currentCredits: result?.new_balance || 0
            },
            { status: 402 }
          );
        }
      }
    }
```

- [ ] **Step 4: AI hata refund'unu kayıtlı-only yap**

Aynı dosyada AI hata yakalama bloğunda refund koşulunu (`if (!userIsAdmin)`) `if (!isAnon && !userIsAdmin)` yap (anonim kullanıcıdan kredi düşülmedi → iade edilmez):

```typescript
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      // AI başarısız oldu — yalnız kayıtlı (admin olmayan) kullanıcıya kredi iade et.
      if (!isAnon && !userIsAdmin) {
        try {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: user!.id,
            p_amount: CREDITS_REQUIRED,
            p_bonus: 0,
            p_payment_id: null,
            p_package_id: null,
            p_idempotency_key: `refund_citation_${user!.id}_${Date.now()}`,
            p_transaction_type: 'refund'
          });
          console.log(`[FormatCitation] Refunded ${CREDITS_REQUIRED} credits to user ${user!.id}`);
        } catch (refundError) {
          console.error('[CRITICAL] Credit refund failed:', refundError);
        }
      }
      return NextResponse.json(
        { error: 'Citation formatting failed. Your credits have been refunded.' },
        { status: 500 }
      );
    }
```

- [ ] **Step 5: Başarı response'unu girişli/girişsiz ayır**

Dosya sonundaki başarı return'ünü (satır ~160-164) şununla değiştir:

```typescript
    return NextResponse.json({
      formatted: response.choices[0].message.content,
      ...(isAnon
        ? { anonymous: true, remainingFree: anonRemaining }
        : { creditsUsed: userIsAdmin ? 0 : CREDITS_REQUIRED, remainingCredits: result?.new_balance ?? 0 }),
    });
```

- [ ] **Step 6: Build doğrula**

Run: `npm run build`
Expected: Derleme başarılı, `/api/format-citation` route listelenir, TS hatası yok. (`user` null olabildiği için `user!.id` non-null assertion'larının yalnız `!isAnon` dalında olduğundan emin ol.)

- [ ] **Step 7: Commit**

```bash
git add app/lib/queue/qstash.ts app/api/format-citation/route.ts
git commit -m "feat(citation): allow anonymous trial with fail-closed daily IP quota"
```

---

## Task 2: Girişsiz deneme — Frontend (CitationFormatter + landing CTA)

**Files:**
- Modify: `app/components/CitationFormatter.tsx`
- Modify: `app/page.tsx` (hero "Ücretsiz Dene" → citation tab)

- [ ] **Step 1: CitationFormatter — state + import ekle**

`app/components/CitationFormatter.tsx` başına `Link` import et ve `remainingFree` state ekle. Satır 2-6 importlardan sonra:

```typescript
import Link from 'next/link';
```

Bileşen içinde (satır 14 civarı, diğer useState'lerin yanına):

```typescript
  const [remainingFree, setRemainingFree] = useState<number | null>(null);
```

- [ ] **Step 2: handleFormat — kredi kontrolünü kayıtlı-only yap, anonim akışı işle**

`handleFormat` fonksiyonunu (satır 19-57) şununla değiştir:

```typescript
  const handleFormat = async () => {
    if (!source) {
      toast.error('Lütfen kaynak bilgisi girin');
      return;
    }

    // Kredi kontrolü yalnız GİRİŞLİ kullanıcı için (anonim ücretsiz deneme backend kotasıyla yönetilir)
    if (user) {
      const creditCheck = checkCredits('citation_format');
      if (!creditCheck.allowed) {
        toast.error(creditCheck.reason || 'Yetersiz kredi');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/format-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, type, format }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Anonim kota doldu / deneme kapalı → kayıt yönlendirmesi
        if (data?.requireAuth) {
          setRemainingFree(0);
          toast.error(data.error || 'Ücretsiz deneme hakkın doldu. Üye ol.');
          return;
        }
        throw new Error(data.error || 'Formatlama başarısız');
      }

      setResult(data.formatted);

      if (data.anonymous) {
        setRemainingFree(typeof data.remainingFree === 'number' ? data.remainingFree : null);
        toast.success('Kaynak formatlandı!');
      } else {
        await refresh();
        toast.success(`Kaynak formatlandı! (${creditCost} kredi kullanıldı)`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Formatlama başarısız');
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 3: Butonu girişsizken aç, metni duruma göre ayarla**

Buton'u (satır 166-189) şununla değiştir:

```typescript
      <button
        onClick={handleFormat}
        disabled={loading || (!!user && !checkCredits('citation_format').allowed)}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Formatlanıyor...</span>
          </div>
        ) : !user ? (
          'Ücretsiz Formatla'
        ) : !checkCredits('citation_format').allowed ? (
          <div className="flex items-center justify-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Yetersiz Kredi</span>
          </div>
        ) : (
          `Formatla (${creditCost} kredi)`
        )}
      </button>
```

(`Lock` importu artık kullanılmıyorsa satır 3'ten kaldır.)

- [ ] **Step 4: Girişsiz kullanıcıya kayıt CTA ekle**

`{/* Result */}` bloğundan (satır 192) HEMEN ÖNCE, anonim kullanıcı için yumuşak CTA ekle:

```typescript
      {/* Anonim deneme: kayıt teşviki */}
      {!user && (
        <div className="rounded-lg bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800 flex items-center justify-between gap-3">
          <span>
            {remainingFree !== null
              ? remainingFree > 0
                ? `Ücretsiz deneme: ${remainingFree} hakkın kaldı.`
                : 'Ücretsiz deneme hakkın doldu.'
              : 'Kayıtlı kullanıcılar sınırsız formatlama + atıf geçmişi kazanır.'}
          </span>
          <Link
            href="/auth?mode=signup"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
          >
            Üye Ol
          </Link>
        </div>
      )}
```

- [ ] **Step 5: Landing "Ücretsiz Dene" → citation tab'ına götür**

`app/page.tsx` hero butonunda (satır 132-138) `onClick`'i değiştir; "Kaynak Formatla" sekmesini aktif edip #app'e kaydır:

```typescript
              <button
                onClick={() => { setActiveTab('citation'); scrollToApp(); }}
                className="btn-primary text-lg px-8 py-4 min-w-[200px]"
                aria-label="Atıf aracını ücretsiz dene"
              >
                Ücretsiz Dene
              </button>
```

(`setActiveTab` ve `scrollToApp` aynı bileşende zaten tanımlı.)

- [ ] **Step 6: Build doğrula**

Run: `npm run build`
Expected: Derleme başarılı, TS hatası yok, kullanılmayan import uyarısı yok.

- [ ] **Step 7: Commit**

```bash
git add app/components/CitationFormatter.tsx app/page.tsx
git commit -m "feat(citation): unlock anonymous trial UI + signup CTA, hero opens citation tab"
```

---

## Task 3: Auth iyileştirme (?mode=signup + opsiyonel username + Google)

**Files:**
- Modify: `app/components/Auth.tsx`
- Modify: `app/auth/page.tsx` (Suspense boundary — useSearchParams için)
- Modify: `app/components/Navbar.tsx` (mobil "Kayıt Ol" linki → ?mode=signup)
- Read first: `app/auth/confirm/page.tsx` (Google OAuth code exchange'i destekliyor mu doğrula)

- [ ] **Step 1: confirm sayfasını oku, OAuth code exchange durumunu belirle**

Run: `app/auth/confirm/page.tsx` dosyasını Read et.
Karar: Eğer `exchangeCodeForSession` / OAuth `code` paramı işleniyorsa Google redirectTo olarak `${origin}/auth/confirm` kullan. İşlenmiyorsa Google butonunun `redirectTo`'sunu `${origin}/auth/confirm` yap AMA Step 4 notunda Kemal'e "confirm sayfası OAuth code exchange eklenmeli" uyarısını ver (çoğu auth-helpers confirm sayfası code exchange yapar; doğrula).

- [ ] **Step 2: Auth.tsx — useSearchParams ile ?mode=signup**

`app/components/Auth.tsx` satır 4'e import ekle:

```typescript
import { useRouter, useSearchParams } from 'next/navigation';
```

Bileşen içinde (satır 23-24) `isSignUp` başlangıcını query'den oku:

```typescript
export default function AuthComponent() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
```

(Mevcut `const router = useRouter();` satırını koru; tek import satırına birleştirildi.)

- [ ] **Step 3: Username'i opsiyonel yap**

`validateForm` içinde signUp bloğundaki username zorunluluğunu (satır 102-105) KALDIR:

```typescript
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Şifreler eşleşmiyor');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Şifre en az 6 karakter olmalıdır');
        return false;
      }
    }
```

signUp çağrısında (satır 159) boş username'i e-posta ön-ekinden türet:

```typescript
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: (() => { const u = formData.username.trim() || formData.email.split('@')[0]; return { username: u, display_name: u }; })()
          }
```

Username input'undan (satır 299) `required` attribute'unu kaldır ve label'ı güncelle (satır 292-294):

```typescript
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Adı <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
```

- [ ] **Step 4: Google ile giriş butonu + handler**

`handleAuth` fonksiyonundan SONRA (satır 236 civarı, `toggleMode`'dan önce) handler ekle:

```typescript
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      const safeRedirect =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : '/';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(safeRedirect)}` },
      });
      if (error) {
        toast.error('Google ile giriş başlatılamadı');
        setLoading(false);
      }
      // başarılıysa tarayıcı Google'a yönlendirilir; setLoading(false) gerekmez
    } catch {
      toast.error('Google ile giriş başlatılamadı');
      setLoading(false);
    }
  };
```

Form'un EN BAŞINA (satır 252, `<form ...>`'dan hemen sonra, `isForgotPassword` bloğundan önce) Google butonu + ayraç ekle (şifre sıfırlama modunda gizli):

```typescript
        {!isForgotPassword && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Google ile devam et
            </button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">veya</span></div>
            </div>
          </>
        )}
```

- [ ] **Step 5: auth/page.tsx'i Suspense ile sar**

`app/auth/page.tsx`'te `useSearchParams` kullanan `AuthComponent` build'de CSR-bailout uyarısı/erroru vermesin diye Suspense ekle. Import'a Suspense ekle ve `<AuthComponent />`'i (satır 25) sar:

```typescript
import { Suspense } from 'react';
import AuthComponent from '../components/Auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
```

```typescript
        <Suspense fallback={<div className="text-center text-gray-400">Yükleniyor...</div>}>
          <AuthComponent />
        </Suspense>
```

- [ ] **Step 6: Navbar mobil "Kayıt Ol" linkini ?mode=signup yap**

`app/components/Navbar.tsx` mobil menüdeki giriş linkini (satır 206-212, metni "Giriş Yap / Kayıt Ol") `/auth?mode=signup`'a yönlendir:

```typescript
                  <Link
                    href="/auth?mode=signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-primary-600 hover:bg-primary-50 font-medium transition-colors duration-200 py-2"
                  >
                    Giriş Yap / Kayıt Ol
                  </Link>
```

(Desktop "Giriş Yap" butonu `/auth` olarak kalır — o giriş amaçlı.)

- [ ] **Step 7: Build doğrula**

Run: `npm run build`
Expected: Derleme başarılı; `/auth` statik/prerender uyarısı yok (Suspense sayesinde); TS hatası yok.

- [ ] **Step 8: Commit**

```bash
git add app/components/Auth.tsx app/auth/page.tsx app/components/Navbar.tsx
git commit -m "feat(auth): signup-mode deep link, optional username, Google OAuth login"
```

---

## Task 4: Rapor → tekrar analiz CTA

**Files:**
- Modify: `app/analyses/[id]/AnalysisDetailContent.tsx`

- [ ] **Step 1: Rapor içeriğinin sonuna "tekrar analiz et" CTA ekle**

`AnalysisDetailContent.tsx` içinde, ana içerik `container` div'inin kapanışından (satır 580 `</div>`) HEMEN ÖNCE — yani `{isPremiumFormat ...}` ve `{!isPremiumFormat ...}` bloklarından sonra — `analyzed` durumunda görünen CTA ekle:

```typescript
        {/* Tekrar analiz köprüsü (tekrar-gelir): yalnız tamamlanmış raporlarda */}
        {analysis.status === 'analyzed' && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm ring-1 ring-primary-100 p-6 sm:p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Eksikleri düzelttin mi?</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-xl mx-auto">
              Rapordaki önerileri uygula, gözden geçirilmiş tezini tekrar analiz et. Her tur, tezini jüri ve YÖK standartlarına biraz daha yaklaştırır.
            </p>
            <Link
              href="/#app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition"
            >
              <TrendingUp className="h-5 w-5" />
              Tezini Tekrar Analiz Et
            </Link>
          </div>
        )}
```

(`Link` ve `TrendingUp` zaten import edili — satır 6 ve 12.)

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: Derleme başarılı, TS hatası yok.

- [ ] **Step 3: Commit**

```bash
git add "app/analyses/[id]/AnalysisDetailContent.tsx"
git commit -m "feat(report): add re-analyze CTA at end of analyzed report"
```

---

## Final: Deploy + canlı doğrulama (tüm task'lar sonrası)

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Deploy doğrula (bg poll)**

Son commit SHA için: `gh api repos/Kemalyavas/tez-asistani/commits/<sha>/status --jq '.state'` → success bekle.

- [ ] **Step 3: Canlı Chrome doğrulama**

- Girişsiz (gizli sekme veya çıkış yapılmış): `/#app` → "Kaynak Formatla" → kaynak gir → "Ücretsiz Formatla" → gerçek sonuç + "Üye Ol" CTA. 4. denemede kota mesajı.
- `/auth?mode=signup` → açılışta KAYIT modu, Google butonu görünür, kullanıcı adı opsiyonel etiketi.
- Kayıtlı (admin) rapor → en altta "Tezini Tekrar Analiz Et" CTA → /#app'e gider.
- Kayıtlı CitationFormatter regresyon: kredi akışı bozulmamış.

- [ ] **Step 4: Google OAuth kurulum notu (Kemal)**

Google butonu çalışması için: Supabase Dashboard → Authentication → Providers → Google = ON; Google Cloud Console → OAuth 2.0 Client (Web) → Authorized redirect URI: `https://uqbggqetipngfdrrilsk.supabase.co/auth/v1/callback`; Client ID + Secret'ı Supabase Google provider'a gir. Kurulum bitene kadar buton hata verir (kod hazır).

---

## Self-Review (yazım sonrası)

- **Spec coverage:** İş1 backend (Task1) + frontend (Task2) ✓; İş2 auth mode/username/Google (Task3) ✓; İş3 rapor CTA (Task4) ✓; fail-closed (Task1 Step3) ✓; landing CTA (Task2 Step5) ✓; doğrulama planı (Final) ✓.
- **Placeholder:** Tüm kod blokları tam; Task3 Step1 yalnız "Read+karar" (OAuth confirm doğrulaması — gerçek bir inceleme adımı, placeholder değil).
- **Type consistency:** `remainingFree` (route response ↔ CitationFormatter state) ✓; `requireAuth` (route ↔ frontend) ✓; `anonymous` flag ✓; `isAnon`/`userIsAdmin` route içi tutarlı ✓; `setActiveTab('citation')` landing'de mevcut tab değeriyle uyumlu ✓.
