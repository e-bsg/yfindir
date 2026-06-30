import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Profile, TransportDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Truck, Globe, Snowflake, AlertTriangle, Search } from 'lucide-react';

type TransportProfile = Profile & { transport_details: TransportDetails | null };

type Props = {
  searchParams: Promise<{ search?: string }>;
  params: Promise<{ locale: string }>;
};

// ISO 3166-1 alpha-2 to English name
const COUNTRY_NAMES: Record<string, string> = {
  GR: 'Greece', BG: 'Bulgaria', RO: 'Romania', RS: 'Serbia',
  TR: 'Turkey', IT: 'Italy', HU: 'Hungary', AT: 'Austria',
  SK: 'Slovakia', MK: 'North Macedonia', AL: 'Albania',
  DE: 'Germany', FR: 'France', PL: 'Poland', CZ: 'Czech Republic',
  HR: 'Croatia', SI: 'Slovenia', UA: 'Ukraine', MD: 'Moldova',
  CN: 'China', US: 'United States', GB: 'United Kingdom',
  ES: 'Spain', PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  FI: 'Finland', EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania',
  JP: 'Japan', KR: 'South Korea', IN: 'India', AE: 'UAE',
  EG: 'Egypt', MA: 'Morocco', ZA: 'South Africa', AU: 'Australia',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

export default async function TransportPage({ searchParams, params }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabase();
  const searchTerm = sp.search?.trim() || '';

  // Fetch all transport profiles (filtered in-memory to avoid .or() on joined tables)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, transport_details(*)')
    .eq('category', 'transport')
    .eq('is_moderated', true)
    .eq('is_blocked', false)
    .order('created_at', { ascending: false });

  const allProfiles = (profiles || []) as TransportProfile[];

  // In-memory search (works for joined table columns like countries_served)
  let transportProfiles = allProfiles;
  if (searchTerm) {
    const termLower = searchTerm.toLowerCase();
    const nameMatches = Object.entries(COUNTRY_NAMES)
      .filter(([, name]) => name.toLowerCase().includes(termLower))
      .map(([code]) => code);

    transportProfiles = allProfiles.filter((p) => {
      if (p.company_name.toLowerCase().includes(termLower)) return true;
      if (p.city.toLowerCase().includes(termLower)) return true;
      const countries = p.transport_details?.countries_served || [];
      return countries.some(c => c.toUpperCase() === searchTerm.toUpperCase() || nameMatches.includes(c.toUpperCase()));
    });
  }

  // Collect all unique countries for autocomplete
  const activeCountries = new Set<string>();
  for (const p of allProfiles) {
    p.transport_details?.countries_served?.forEach(c => activeCountries.add(c));
  }
  const countryOptions = Array.from(activeCountries).sort();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <TransportTitle />
        </h1>
        <p className="mt-2 text-muted-foreground">
          <TransportSubtitle />
        </p>
      </div>

      {/* Search with autocomplete */}
      <div className="mb-8">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            list="country-suggestions"
            defaultValue={searchTerm || ''}
            placeholder={searchTerm ? '' : 'Search by company, country code (GR) or country name (Greece)...'}
            autoComplete="off"
            className="w-full rounded-md border pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <datalist id="country-suggestions">
            {countryOptions.map(code => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
            {countryOptions.map(code => (
              <option key={`name-${code}`} value={countryName(code)} />
            ))}
          </datalist>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                // Reset by submitting empty form
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/transport" className="text-xs">✕</Link>
            </button>
          )}
        </form>

        {searchTerm && (
          <p className="mt-3 text-sm text-muted-foreground">
            <SearchResults count={transportProfiles.length} searchTerm={searchTerm} />
          </p>
        )}
      </div>

      {/* Transport cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transportProfiles.map((profile) => {
          const td = profile.transport_details;
          return (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="rounded-lg border bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt={profile.company_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Truck className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {profile.company_name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {profile.city && profile.country
                      ? `${profile.city}, ${profile.country}`
                      : profile.country || profile.city}
                  </p>
                </div>
              </div>

              {/* Details section */}
              {td && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  {/* Countries served */}
                  {td.countries_served && td.countries_served.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          <CountriesServedLabel />
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {td.countries_served.map((code) => (
                          <span
                            key={code}
                            title={countryName(code)}
                            className="rounded-full bg-accent px-2 py-0.5 text-xs cursor-help"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle types */}
                  {td.vehicle_types && td.vehicle_types.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          <VehicleTypesLabel />
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {td.vehicle_types.map((vt) => (
                          <span
                            key={vt}
                            className="rounded-full bg-accent px-2 py-0.5 text-xs"
                          >
                            {vt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {td.has_refrigerated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 px-2.5 py-1 text-xs font-medium">
                        <Snowflake className="h-3 w-3" />
                        <RefrigeratedLabel />
                      </span>
                    )}
                    {td.has_adr && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        <AdrLabel />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* No details fallback */}
              {!td && (
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    <NoDetails />
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {transportProfiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Truck className="h-16 w-16 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-medium text-foreground">
            <NoTransportFound />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            <NoTransportHint />
          </p>
        </div>
      )}
    </div>
  );
}

// Translation wrapper components
async function TransportTitle() {
  const t = await getTranslations('common');
  return <>{t('transport')}</>;
}

async function TransportSubtitle() {
  const t = await getTranslations('transport');
  return <>{t('page_subtitle')}</>;
}

function SearchResults({ count, searchTerm }: { count: number; searchTerm: string }) {
  return <>{count} result{count !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;</>;
}

async function CountriesServedLabel() {
  const t = await getTranslations('transport');
  return <>{t('countries_served')}</>;
}

async function VehicleTypesLabel() {
  const t = await getTranslations('transport');
  return <>{t('vehicle_types')}</>;
}

async function RefrigeratedLabel() {
  const t = await getTranslations('transport');
  return <>{t('refrigerated')}</>;
}

async function AdrLabel() {
  const t = await getTranslations('transport');
  return <>{t('adr')}</>;
}

async function NoDetails() {
  const t = await getTranslations('transport');
  return <>{t('no_details')}</>;
}

async function NoTransportFound() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}

async function NoTransportHint() {
  const t = await getTranslations('transport');
  return <>{t('no_results_hint')}</>;
}
