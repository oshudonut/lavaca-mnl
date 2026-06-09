-- 1. customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  default_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  weight_label VARCHAR(50) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- 3. delivery_dates
CREATE TABLE delivery_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_open BOOLEAN DEFAULT TRUE,
  max_orders_total INT DEFAULT 10 CHECK (max_orders_total > 0),
  closure_reason TEXT,
  closure_type VARCHAR(20) CHECK (closure_type IN ('operational', 'holiday', 'vacation')),
  cal_availability_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. delivery_slots
CREATE TABLE delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_date_id UUID NOT NULL REFERENCES delivery_dates(id) ON DELETE CASCADE,
  slot_window VARCHAR(2) NOT NULL CHECK (slot_window IN ('AM', 'PM')),
  window_start TIME NOT NULL,
  window_end TIME NOT NULL,
  max_orders INT DEFAULT 5 CHECK (max_orders > 0),
  booked_count INT DEFAULT 0 CHECK (booked_count >= 0),
  is_open BOOLEAN DEFAULT TRUE,
  UNIQUE(delivery_date_id, slot_window)
);

-- 5. business_announcements
CREATE TABLE business_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT FALSE,
  message TEXT NOT NULL,
  closed_from DATE NOT NULL,
  closed_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  delivery_slot_id UUID NOT NULL REFERENCES delivery_slots(id),
  status VARCHAR(30) NOT NULL CHECK (status IN (
    'PENDING_PAYMENT',
    'PAYMENT_REVIEW',
    'CONFIRMED',
    'AWAITING_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'EXPIRED'
  )),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee DECIMAL(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('gcash', 'bank_transfer')),
  payment_screenshot_url TEXT,
  payment_reference VARCHAR(100),
  calendar_event_id VARCHAR(255),
  lalamove_booking_id VARCHAR(255),
  lalamove_tracking_url TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  screenshot_uploaded_at TIMESTAMPTZ
);

-- 7. order_items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- 8. notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  template_id VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. system_events
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  event_name VARCHAR(100) NOT NULL,
  triggered_by VARCHAR(50) NOT NULL,
  payload JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_orders_customer_id       ON orders(customer_id);
CREATE INDEX idx_orders_delivery_slot_id  ON orders(delivery_slot_id);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_order_items_order_id     ON order_items(order_id);
CREATE INDEX idx_notifications_order_id  ON notifications(order_id);
CREATE INDEX idx_system_events_order_id  ON system_events(order_id);

-- Atomic slot booking: increments booked_count only if slot is open and not full.
-- Distinguishes slot_not_found (bad UUID) from slot_full (capacity reached).
-- Called via: supabase.rpc('increment_slot_booking', { p_slot_id: '...' })
CREATE OR REPLACE FUNCTION increment_slot_booking(p_slot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM delivery_slots WHERE id = p_slot_id) THEN
    RAISE EXCEPTION 'slot_not_found'
      USING ERRCODE = 'P0003',
            DETAIL  = 'No delivery slot found with the given ID';
  END IF;

  UPDATE delivery_slots
  SET booked_count = booked_count + 1
  WHERE id = p_slot_id
    AND booked_count < max_orders
    AND is_open = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_full'
      USING ERRCODE = 'P0002',
            DETAIL  = 'The selected delivery slot has reached its maximum capacity or is closed';
  END IF;
END;
$$;

-- Symmetric decrement for order expiry/cancellation
CREATE OR REPLACE FUNCTION decrement_slot_booking(p_slot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE delivery_slots
  SET booked_count = GREATEST(0, booked_count - 1)
  WHERE id = p_slot_id;
END;
$$;
