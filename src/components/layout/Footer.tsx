import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function Footer() {
  const t = await getTranslations('common');
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Yfantis B2B. {t('rights_reserved')}</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/catalog" className="hover:text-primary">{t('catalog')}</Link>
          <Link href="/register" className="hover:text-primary">{t('register')}</Link>
        </div>
      </div>
    </footer>
  );
}
