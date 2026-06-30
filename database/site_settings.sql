-- Add site_settings table for admin configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON site_settings TO authenticated;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Admin (super_admin/admin) can manage; everyone can read
CREATE POLICY "public_read_settings" ON site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can modify (handled via service_role in API, but allow via RLS too)
CREATE POLICY "admin_manage_settings" ON site_settings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = (SELECT auth.uid())
    AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin', 'admin'))
  ));

-- Set default value
INSERT INTO site_settings (key, value) VALUES ('homepage.max_listings_per_category', '2')
ON CONFLICT (key) DO NOTHING;
