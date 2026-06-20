'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, User as UserIcon, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Uygulama (giriş gerektiren) rotaları: kompakt app-header gösterilir.
const APP_ROUTES = ['/analyses', '/profile', '/upload'];

const MARKETING_LINKS = [
  { href: '/#how', label: 'Nasıl çalışır' },
  { href: '/#tools', label: 'Araçlar' },
  { href: '/akademik-formatlar', label: 'Formatlar' },
  { href: '/blog', label: 'Blog' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        if (active) setCredits(profile?.credits ?? null);
      } else {
        setCredits(null);
      }
    };
    load();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setCredits(null);
      else load();
    });
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    setIsMenuOpen(false);
  };

  // /auth ve /payment'ta global nav gizli (bu sayfaların kendi minimal üst barı var)
  if (pathname.startsWith('/auth') || pathname.startsWith('/payment')) return null;

  const initial = (
    user?.user_metadata?.username?.[0] ||
    user?.user_metadata?.full_name?.[0] ||
    user?.email?.[0] ||
    'T'
  ).toUpperCase();

  const creditLabel = credits === null ? null : (credits >= 999999 ? '∞' : credits.toLocaleString('tr-TR'));

  // App-header: giriş gerektiren rotalar; /pricing yalnızca giriş yapılmışsa.
  const isAppRoute =
    APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    (pathname === '/pricing' && !!user);

  const logo = (
    <Link href="/" className="flex items-center group" aria-label="TezAI ana sayfa">
      <Image
        src="/logo.png"
        alt="TezAI"
        width={88}
        height={88}
        className="h-[68px] w-auto group-hover:scale-105 transition-transform duration-300"
        priority
      />
    </Link>
  );

  const creditChip = creditLabel !== null && (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors"
      title="Kredilerim"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5a2.5 2 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" /><path d="M12 17h.01" /></svg>
      <span className="text-ink">{creditLabel} kredi</span>
    </Link>
  );

  const avatar = (
    <Link
      href="/profile"
      aria-label="Profilim"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
    >
      {initial}
    </Link>
  );

  // ===== APP HEADER =====
  if (isAppRoute) {
    return (
      <header className="sticky top-0 z-50 bg-paper-cool/85 backdrop-blur-md border-b border-line-cool">
        <div className="max-w-6xl mx-auto px-5 sm:px-7">
          <div className="flex items-center justify-between h-20 gap-4">
            {logo}
            <div className="flex items-center gap-3 sm:gap-4">
              {creditChip}
              {user && (
                <>
                  <Link
                    href="/analyses"
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-primary-700 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analizlerim
                  </Link>
                  {avatar}
                  <button
                    onClick={handleLogout}
                    aria-label="Çıkış yap"
                    className="text-ink/40 hover:text-red-600 transition-colors p-1"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
              {!user && (
                <Link href="/auth" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                  Giriş yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ===== MARKETING NAV =====
  return (
    <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-line">
      <nav className="max-w-6xl mx-auto px-5 sm:px-9">
        <div className="flex items-center justify-between h-20 gap-6">
          {logo}

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {MARKETING_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] font-bold tracking-[0.07em] uppercase text-ink/60 hover:text-primary-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/analyses" className="text-sm font-semibold text-ink/80 hover:text-primary-700 transition-colors">
                  Analizlerim
                </Link>
                {avatar}
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                  <LogOut className="h-4 w-4" />
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-semibold text-ink/80 hover:text-primary-700 transition-colors">
                  Giriş yap
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-md transition-colors"
                >
                  Ücretsiz dene
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-primary-50 transition-colors"
            aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-line">
            <div className="flex flex-col gap-1">
              {MARKETING_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-ink/70 hover:text-primary-700 font-semibold py-2.5"
                >
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-line mt-2 pt-3 flex flex-col gap-1">
                {user ? (
                  <>
                    <Link href="/analyses" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-ink/70 hover:text-primary-700 font-semibold py-2.5">
                      <BarChart3 className="h-4 w-4" /> Analizlerim
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-ink/70 hover:text-primary-700 font-semibold py-2.5">
                      <UserIcon className="h-4 w-4" /> Profilim
                    </Link>
                    <button onClick={handleLogout} className="text-left text-red-600 font-semibold py-2.5">
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" onClick={() => setIsMenuOpen(false)} className="text-primary-700 font-semibold py-2.5">
                      Giriş yap
                    </Link>
                    <Link href="/auth?mode=signup" onClick={() => setIsMenuOpen(false)} className="text-white bg-primary-600 font-semibold py-2.5 px-4 rounded-md text-center">
                      Ücretsiz dene
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
