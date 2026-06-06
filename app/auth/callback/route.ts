import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// OAuth (Google) PKCE code exchange — SERVER tarafında yapılır.
// Client-side exchange (eski /auth/confirm yaklaşımı) PKCE code-verifier cookie'sini
// güvenilir okuyamıyordu ("both auth code and code verifier should be non-empty").
// Route handler request cookie'lerine erişir → verifier güvenle bulunur.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  // Open-redirect guard: yalnız tek '/' ile başlayan göreli yol kabul edilir.
  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error('[auth/callback] code exchange error:', error.message);
  }

  // Hata / code yok → giriş sayfasına dön, kullanıcıya bildirilebilir
  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
