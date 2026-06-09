-- ============================================================================
-- Part 1: Create private storage bucket for payment screenshots
-- ============================================================================

-- Create private payment-screenshots bucket (no public access)
-- File size limit: 5MB. Allowed types: JPEG, PNG, PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  false,
  5242880,   -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Only service role can access payment-screenshots bucket (all public access blocked)
-- RLS policy ensures no unauthenticated or customer access to screenshots
CREATE POLICY "service_role_only" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'payment-screenshots')
  WITH CHECK (bucket_id = 'payment-screenshots');

-- ============================================================================
-- Part 2: Seed product data (three Angus Roast Beef products)
-- ============================================================================

-- Confirmed prices from business vault (Catalog.md):
-- LV-100:  ₱350.00  (100g)
-- LV-1000: ₱3,000.00 (1kg)
-- LV-1500: ₱4,000.00 (1.5kg)
INSERT INTO products (sku, name, description, price, weight_label, is_available, sort_order)
VALUES
  ('LV-100',  'Angus Roast Beef', 'Premium Angus, sliced', 350.00,  '100g',  true, 1),
  ('LV-1000', 'Angus Roast Beef', 'Premium Angus, sliced', 3000.00, '1kg',   true, 2),
  ('LV-1500', 'Angus Roast Beef', 'Premium Angus, sliced', 4000.00, '1.5kg', true, 3)
ON CONFLICT (sku) DO NOTHING;
