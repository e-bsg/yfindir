-- ============================================================
-- FIX MIGRATION: RLS, localized profiles, admin roles
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. RLS: Allow authenticated users to read moderated profiles
--    (Previously only anon could — logged-in users saw nothing)
DROP POLICY IF EXISTS "authenticated_read_moderated" ON profiles;
CREATE POLICY "authenticated_read_moderated" ON profiles
  FOR SELECT TO authenticated
  USING (is_moderated = true AND is_blocked = false);

-- Also fix same issue on listings for authenticated users
DROP POLICY IF EXISTS "authenticated_read_listings" ON listings;
CREATE POLICY "authenticated_read_listings" ON listings
  FOR SELECT TO authenticated
  USING (is_moderated = true AND is_active = true);

-- Same for transport_details
DROP POLICY IF EXISTS "authenticated_read_transport" ON transport_details;
CREATE POLICY "authenticated_read_transport" ON transport_details
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = transport_details.profile_id
    AND profiles.is_moderated = true AND profiles.is_blocked = false
  ));

-- 2. Add localized description columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description_el TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description_it TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description_zh TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description_bg TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- Migrate existing: description (Greek) → description_el, description_en stays
UPDATE profiles SET description_el = description WHERE description IS NOT NULL AND description != '' AND description_el IS NULL;

-- Update search vector to include localized descriptions
CREATE OR REPLACE FUNCTION profiles_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.company_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_el, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_it, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_zh, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_bg, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_tr, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.country, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Super-admin separation: update existing admin to super_admin
--    Regular admin role check: app_metadata.role = 'admin'
--    Super-admin role check: app_metadata.role = 'super_admin'
-- Update your super-admin account
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
WHERE email = 'admin@yfantis.com';

-- Client admin stays as 'admin'
-- (already set correctly)
