-- Enable RLS on all tables
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_dates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events          ENABLE ROW LEVEL SECURITY;

-- Public read: products, delivery_dates, delivery_slots, business_announcements
CREATE POLICY "anon_select" ON products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select" ON delivery_dates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select" ON delivery_slots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select" ON business_announcements
  FOR SELECT TO anon, authenticated USING (true);

-- Orders: allow anon SELECT (app always filters by order_number).
-- All writes use service role which bypasses RLS.
CREATE POLICY "anon_select" ON orders
  FOR SELECT TO anon, authenticated USING (true);

-- customers, order_items, notifications, system_events:
-- No public policies. Service role bypasses RLS automatically.
-- Authenticated admin users (Supabase Auth) also need access:
CREATE POLICY "authenticated_all" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select" ON notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON system_events
  FOR SELECT TO authenticated USING (true);
