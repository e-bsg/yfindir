'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { Menu, X, Globe } from 'lucide-react';

export function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  // next-intl's usePathname strips locale prefix for default locale
  // Get locale from the raw pathname via window or fallback
  const rawPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
  const locale = rawPath.split('/')[1] && ['en','el','it','zh','bg','tr'].includes(rawPath.split('/')[1]) 
    ? rawPath.split('/')[1] 
    : 'en';
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const links = [
    { href: '/catalog', label: t('catalog') },
    { href: '/listings', label: t('listings') },
    { href: '/transport', label: t('transport') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span>🔷</span>
          <span>Yfantis B2B</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname.includes(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher currentLocale={locale} currentPath={pathname} />
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/messages" className="text-sm text-muted-foreground hover:text-primary">
                {t('messages')}
              </Link>
              <Link href="/profile/edit" className="text-sm text-muted-foreground hover:text-primary">
                {t('profile')}
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr />
            <LocaleSwitcher currentLocale={locale} currentPath={pathname} />
            {user ? (
              <>
                <Link href="/profile/edit" className="text-sm">{t('profile')}</Link>
                <Link href="/messages" className="text-sm">{t('messages')}</Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="text-sm text-left text-destructive"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm">{t('login')}</Link>
                <Link href="/register" className="text-sm font-medium text-primary">{t('register')}</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

const localeNames: Record<string, string> = {
  en: 'English',
  el: 'Ελληνικά',
  it: 'Italiano',
  zh: '中文',
  bg: 'Български',
  tr: 'Türkçe',
};

function LocaleSwitcher({ currentLocale, currentPath }: { currentLocale: string; currentPath?: string }) {
  const nextLocale = currentLocale === 'en' ? 'el' : 'en';
  const label = localeNames[nextLocale] || nextLocale.toUpperCase();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={currentPath || '/'}
        locale={nextLocale}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <Globe className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </div>
  );
}
