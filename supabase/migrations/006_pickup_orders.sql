-- supabase/migrations/006_pickup_orders.sql
--
-- Switch ordering from delivery slots (AM/PM with capacity) to pickup:
-- orders now reference their date directly and store a chosen pickup time.
-- Slot and address columns become optional so legacy delivery orders keep
-- their data while new pickup orders leave them empty. Customers can add an
-- optional special request instead of an address.

ALTER TABLE orders
  ADD COLUMN delivery_date_id UUID REFERENCES delivery_dates(id),
  ADD COLUMN pickup_time TIME,
  ADD COLUMN special_request TEXT;

ALTER TABLE orders ALTER COLUMN delivery_slot_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN delivery_address DROP NOT NULL;

-- Backfill the date for existing slot-based orders
UPDATE orders o
SET delivery_date_id = s.delivery_date_id
FROM delivery_slots s
WHERE o.delivery_slot_id = s.id
  AND o.delivery_date_id IS NULL;

CREATE INDEX idx_orders_delivery_date_id ON orders(delivery_date_id);
