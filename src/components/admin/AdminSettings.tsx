'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AdminSettings() {
  const [maxPerCat, setMaxPerCat] = useState('2');
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'homepage.max_listings_per_category')
          .single();
        if (data?.value) setMaxPerCat(data.value);
      } catch { /* table might not exist */ }
    })();
  }, []);

  async function save() {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'homepage.max_listings_per_category', value: maxPerCat, updated_at: new Date().toISOString() });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="font-semibold text-lg mb-2">Homepage Settings</h2>
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Max listings per category:</label>
        <input
          type="number"
          min="1"
          max="10"
          value={maxPerCat}
          onChange={(e) => setMaxPerCat(e.target.value)}
          className="w-16 rounded-md border px-2 py-1 text-sm"
        />
        <button
          onClick={save}
          className="rounded-md bg-primary px-4 py-1 text-sm text-primary-foreground hover:bg-primary/90"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}
