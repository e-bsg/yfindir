'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/catalog');
        router.refresh();
      }
    });
  }, []);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <p className="text-muted-foreground">Signing in…</p>
    </div>
  );
}
