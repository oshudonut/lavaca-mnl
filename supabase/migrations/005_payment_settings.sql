-- supabase/migrations/005_payment_settings.sql

CREATE TABLE payment_settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gcash_number       TEXT NOT NULL DEFAULT '',
  gcash_account_name TEXT NOT NULL DEFAULT '',
  bpi_account        TEXT NOT NULL DEFAULT '',
  bpi_name           TEXT NOT NULL DEFAULT '',
  bdo_account        TEXT NOT NULL DEFAULT '',
  bdo_name           TEXT NOT NULL DEFAULT '',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON payment_settings
  FOR SELECT TO anon, authenticated USING (true);
