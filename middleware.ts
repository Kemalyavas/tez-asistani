import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Giriş gerektiren sayfalar
const PROTECTED_ROUTES = ['/analyses', '/profile', '/payment']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    const pathname = req.nextUrl.pathname
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    // Korumalı sayfaya giriş yapmadan erişim
    if (isProtected && !session) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Giriş yapmış kullanıcı /auth sayfasına gitmeye çalışırsa
    if (pathname.startsWith('/auth') && session && !pathname.startsWith('/auth/confirm') && !pathname.startsWith('/auth/reset-password')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|og|api).*)',
  ],
}
