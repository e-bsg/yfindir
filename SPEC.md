# Yfantis Industry Directory — Project Specification



## Business Proposal: Migrating Yfantis B2B Directory to Laravel + Filament v5
Prepared for: Executive Management
Objective: Reduce technical risk, eliminate ongoing development delays, and guarantee long-term stability using a unified PHP infrastructure.
------------------------------
## Executive Summary
Our current technical draft proposes a decoupled JavaScript framework (Next.js 16 + Vercel + Supabase). While modern, this stack introduces significant operational risks for our business model, including steep development friction, fragmented security layers, and complex debugging processes.
By pivoting the Yfantis Industry Directory to a native Laravel PHP + Filament v5 architecture, we unify our entire application into a single, cohesive language. This shift allows us to bypass expensive cloud infrastructure and deploy a scalable, multi-tenant industrial directory directly onto standard, low-cost cPanel shared hosting, using an automated development pipeline that mimics the modern developer experience of Vercel.
------------------------------
## Key Business and Technical Advantages## 1. Zero Infrastructure Costs (Deployable on cPanel Apache)
Unlike heavy enterprise software that requires dedicated virtual private servers, the Laravel + Filament v5 stack runs efficiently on standard cPanel shared hosting (requiring PHP 8.2+). We eliminate modern infrastructure overhead while retaining full control over our environment.

* By utilizing an optimized .htaccess routing strategy, we isolate our application data files securely from the public internet without modifying traditional cPanel directory layouts.
* Your current hosting investments are fully preserved with no new monthly recurring server fees.

## 2. Advanced Vercel-Style Automated Deployment (No Technical Debt)
We do not sacrifice modern deployment workflows by choosing PHP. We can configure a GitHub Actions CI/CD Pipeline that automates production releases.

* The Workflow: Developers simply run git push. GitHub’s remote cloud runners automatically download the code, compile frontend Tailwind CSS v4 assets, optimize database connectors, strip out development files, and sync the clean application to cPanel via secure FTP.
* The Benefit: Heavy asset building happens on GitHub's free infrastructure rather than taxing or crashing our shared cPanel server resources.

## 3. Native Multi-Panel Architecture out of the Box
A global B2B directory requires complex user segmentation. Filament v5 includes a native Multi-Panel Feature designed specifically for this requirement:

* The Administrative Panel (/admin): A secure, data-dense interface out of the box for internal managers to review tax IDs (ΑΦΜ), moderate industrial listings, ban malicious users, and update global configuration toggles.
* The Business Owner Panel (/dashboard): An isolated, user-friendly workspace generated automatically for factories, transport firms, and personnel leads to manage their own business profiles and job listings.
* Writing this multi-role authentication system by hand in JavaScript would require weeks of custom code. Filament provides it natively.

## 4. Future-Proof Multilingual Architecture (Scale Past 6 Locales)
Our specification requires launch support for multiple international languages (Greek, English, Italian, etc.).

* The JavaScript Trap: Forces developers to append hardcoded table columns (e.g., description_en, description_el, description_it), meaning adding a new target language requires rewriting database structures and broken code logic.
* The Filament Upgrade: Integrates natively with translation engines directly at the database model level using flexible JSON formatting. Filament automatically generates visual language tabs for input forms, allowing administrators to swap between languages with a single click.

## 5. Superior Performance on Relational Queries (The Transport Module)
Our specialized "Transport" section requires deep relational filtering, such as cross-referencing multi-country arrays, vehicle categories, and strict hazard parameters (ADR).

* Cloud databases like Supabase struggle with advanced multi-table array intersections, forcing apps to pull thousands of entries into memory to filter them with client-side JavaScript.
* Laravel handles these structures through high-performance, native database queries executed at the engine layer, ensuring instantaneous page responses as our directory scales to tens of thousands of corporate profiles.

------------------------------
## Operational and Financial Impact

| Operational Metric | Next.js + Supabase JavaScript Stack | Laravel + Filament v5 PHP Stack |
|---|---|---|
| Development Cost | High. Custom interfaces, API routing, and RLS policies built from scratch. | Low. Core directory features and admin components are natively pre-built. |
| Hosting Requirements | Multi-vendor dependency (Vercel, Supabase, Cloud providers). | Single, self-contained cPanel Shared Hosting Account. |
| Maintenance & Bug Fixing | Complex. Scattered across components, middleware, and cloud console configurations. | Simple. Single language codebase with unified debugging paths. |
| Time to Market | Estimated 2-3 Months of development. | Estimated 3-4 Weeks to a fully operational launch. |

------------------------------
## Strategic Recommendation
Building straight with a decoupled JavaScript framework creates an invisible boundary where small adjustments or custom business features require complex architecture overhauls.
Pivoting to Laravel + Filament v5 gives us a 70% head start on our directory structure, ensures native data security through standardized server-side policies, minimizes long-term software upkeep expenses, and keeps our deployment workflows fast, automated, and compatible with affordable hosting architectures.
------------------------------









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
