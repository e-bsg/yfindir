# Yfantis Industry Directory — Project Specification

## Overview

Global industrial B2B catalog (mini Alibaba / Globy) targeting factories, manufacturers, logistics, and industrial services across multiple countries.

| Property | Value |
|---|---|
| **Repository** | `github.com/e-bsg/yfindir` |
| **Production URL** | `yfindir.vercel.app` |
| **Local path** | `/mnt/storage/Projects/yfantis` |
| **Monthly cost** | $0 (Vercel + Supabase free tiers) |

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Turbopack, React 19, Server Components |
| Language | TypeScript 5 | Strict mode |
| Database | Supabase (PostgreSQL 15) | Free tier: 500MB DB, 50k MAU |
| Auth | Supabase Auth + RLS | Email/password + Google OAuth (pending keys) |
| Storage | Supabase Storage | `logos` and `listings` buckets |
| i18n | next-intl v4 | 6 locales, server-side translations |
| CSS | Tailwind CSS v4 | Oxide engine, CSS-first config (`@theme`) |
| Icons | Lucide React | Feather-compatible icon set |
| Toasts | Sonner | Client-side notifications |
| Package manager | pnpm | Disk-efficient, fast |
| Deployment | Vercel | Auto-deploy from GitHub `master` |
| CLI tools | mise | Node, pnpm, supabase, gh managed via mise |

---

## Locales

| Code | Language | Status |
|---|---|---|
| `en` | English | **Primary** — all content mandatory in English |
| `el` | Greek | Secondary — full translation |
| `it` | Italian | Full translation |
| `zh` | Chinese | Placeholder (en copy) |
| `bg` | Bulgarian | Placeholder (en copy) |
| `tr` | Turkish | Placeholder (en copy) |

**Default locale:** `en` (no URL prefix). Others: `/el`, `/it`, etc.

**Locale switcher:** Custom implementation in `Header.tsx` using manual URL construction (`localeUrl()`) to avoid next-intl Link double-prefixing bug. Uses `useParams()` from `next/navigation` for locale detection.

---

## Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Super Admin | `admin@yfantis.com` | `Admin123!@#` | Full dashboard, moderation, settings |
| Client Admin | `client@yfantis.com` | `ClientAdmin2026!` | Moderation, user management, settings |
| Demo Companies (11) | `*@demo-b2b.gr` etc. | `Demo1234!` | Normal user, can post listings |

**Role separation:**
- `app_metadata.role = 'super_admin'` — unrestricted (you)
- `app_metadata.role = 'admin'` — moderation + settings (client)
- No role metadata — regular user

---

## Database Schema

All tables in `public` schema with RLS enabled.

### `profiles` (extends `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Linked to auth.users |
| category | enum | factory, business, transport, personnel |
| company_name | TEXT | Required |
| email | TEXT | Required |
| afm | TEXT | Tax ID |
| phone | TEXT | Mobile |
| logo_url | TEXT | Supabase Storage URL |
| description | TEXT | Primary description |
| description_en | TEXT | English version |
| description_el | TEXT | Greek (migration pending) |
| description_it, zh, bg, tr | TEXT | Other locales (migration pending) |
| country, city | TEXT | Location |
| is_moderated | BOOLEAN | Admin approval required |
| is_blocked | BOOLEAN | Ban flag |
| subscription_tier | enum | free, basic, premium |

### `listings`
Job offers, job seeking, and industrial services.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| profile_id | UUID FK | Owner |
| title, description | TEXT | English (mandatory) |
| title_el, title_it, etc. | TEXT | Locale overrides (optional) |
| description_el, description_it, etc. | TEXT | Locale overrides (optional) |
| type | enum | job_offer, job_seeking, service |
| category, location | TEXT | |
| salary_min, salary_max | NUMERIC | |
| is_moderated | BOOLEAN | |
| is_active | BOOLEAN | |

### `listing_images`
| Column | Type |
|---|---|
| id | UUID PK |
| listing_id | UUID FK → listings |
| url | TEXT NOT NULL |
| alt | TEXT |
| sort_order | INTEGER |

### `transport_details`
| Column | Type |
|---|---|
| profile_id | UUID FK → profiles |
| countries_served | TEXT[] |
| vehicle_types | TEXT[] |
| has_refrigerated | BOOLEAN |
| has_adr | BOOLEAN |

### `messages`
Internal admin↔user messaging.

### `moderation_logs`
Audit trail for all moderation actions.

### `companies` & `company_members`
Multi-company agent support (migration pending).

### `site_settings`
Key-value admin settings. Current keys:
- `homepage.max_listings_per_category` (default: `"2"`)

---

## RLS Policies

All tables use `TO authenticated` / `TO anon` (not deprecated `auth.role()`). UPDATE policies include both USING and WITH CHECK.

**Critical fix pending:** `fix_rls_locales_roles.sql` adds `authenticated_read_moderated` policy so logged-in users can see public profiles (currently only `anon` can).

---

## Routes

### Pages (all under `/[locale]`)
| Route | Type | Auth |
|---|---|---|
| `/` | Server | Public |
| `/catalog` | Server | Public |
| `/transport` | Server | Public |
| `/listings` | Server | Public |
| `/listings/[id]` | Server | Public (detail page) |
| `/listings/new` | Client | Login required |
| `/login` | Client | Guest only |
| `/register` | Client | Guest only |
| `/profile/[id]` | Server | Public |
| `/profile/edit` | Client | Login required |
| `/messages` | Server | Login required |
| `/messages/[id]` | Server | Login required |
| `/admin` | Server | Admin only |
| `/admin/moderation` | Server | Admin only |

### API Routes
| Route | Methods | Auth |
|---|---|---|
| `/api/profiles` | GET, PUT | Session required (PUT) |
| `/api/listings` | GET, POST | Public (GET), Session (POST) |
| `/api/messages` | GET, POST | Session required |
| `/api/admin/moderate` | POST | Admin only |
| `/api/admin/users` | GET, POST | Admin only |

---

## Key Architectural Decisions

1. **Locale URL construction:** `localeUrl(rawPath, targetLocale)` strips current locale, adds target. Uses plain `<a>` tags instead of next-intl `<Link>` to prevent double-prefixing (`/it/el/catalog` bug).

2. **Transport search:** In-memory filtering (not `.or()` on joined tables). Supabase `.or()` only applies to the main table, so `countries_served` array filtering is done in JS.

3. **Homepage listings:** Fetches 20 latest, deduplicates by type category, caps at `maxPerCategory` (default 2), total max 8.

4. **Images:** Uses `<img>` tags (not Next.js `<Image>`) for Unsplash placeholders and uploaded listing images. `next.config.ts` allows all HTTPS remote patterns.

---

## Environment Variables

Required on Vercel and in `.env.local`:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret |

---

## Pending Tasks

### User must run in Supabase SQL Editor:
1. `database/fix_rls_locales_roles.sql`
2. `database/site_settings.sql`
3. `database/migration_agents.sql`
4. `database/migration_localized_listings.sql`

### Google OAuth:
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add to Supabase → Authentication → Providers → Google
3. Add `https://yfindir.vercel.app/auth/callback` to authorized redirect URIs

---

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
git push          # Push to GitHub → triggers Vercel deploy
```
