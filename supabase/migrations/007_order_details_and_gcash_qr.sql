-- supabase/migrations/007_order_details_and_gcash_qr.sql
--
-- Structured customer address + optional Instagram name on orders,
-- a warm/frozen choice per order item, and an admin-uploaded GCash QR code.

ALTER TABLE orders
  ADD COLUMN address_street   TEXT,
  ADD COLUMN address_village  TEXT,
  ADD COLUMN address_city     TEXT,
  ADD COLUMN address_zip      VARCHAR(10),
  ADD COLUMN instagram_handle TEXT;

-- NULL for items ordered before this option existed
ALTER TABLE order_items
  ADD COLUMN serving_style VARCHAR(10) CHECK (serving_style IN ('warm', 'frozen'));

ALTER TABLE payment_settings
  ADD COLUMN gcash_qr_url TEXT;

-- Public bucket for images shown to customers (GCash QR). Uploads go through
-- the admin API with the service role; anyone can read via the public URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-assets',
  'payment-assets',
  true,
  2097152,   -- 2MB
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "payment_assets_service_role" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'payment-assets')
  WITH CHECK (bucket_id = 'payment-assets');
