-- supabase/migrations/004_date_product_exclusions.sql

CREATE TABLE date_product_exclusions (
  delivery_date_id UUID NOT NULL REFERENCES delivery_dates(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (delivery_date_id, product_id)
);

ALTER TABLE date_product_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON date_product_exclusions
  FOR SELECT TO anon, authenticated USING (true);
