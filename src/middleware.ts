import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const VALID_LOCALES = ['en', 'el', 'it', 'zh', 'bg', 'tr'];
const PROTECTED_ROUTES = ['profile', 'messages', 'admin', 'listings/new'];

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Let next-intl handle locale detection first
  const intlResponse = intlMiddleware(request);

  // Run Supabase session update
  const { user } = await updateSession(request);

  const { pathname } = intlResponse.headers.get('x-middleware-rewrite')
    ? new URL(intlResponse.headers.get('x-middleware-rewrite')!, request.url)
    : request.nextUrl;

  const segments = pathname.split('/').filter(Boolean);
  const locale = VALID_LOCALES.includes(segments[0]) ? segments[0] : null;
  const route = locale ? segments[1] : segments[0];

  // Protected routes
  if (route && PROTECTED_ROUTES.includes(route)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale ? `/${locale}` : ''}/login`;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin routes
  if (route === 'admin' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale ? `/${locale}` : ''}/login`;
    return NextResponse.redirect(url);
  }

  // Public auth pages when already logged in — redirect to catalog
  if ((route === 'login' || route === 'register') && user) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale ? `/${locale}` : ''}/catalog`;
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
