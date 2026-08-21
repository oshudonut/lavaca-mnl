# Date-Based Product Availability — Design Spec

**Status:** Approved for planning
**Date:** 2026-08-21

## Problem

Product availability (`products.is_available`) and delivery-date availability
(`delivery_dates` / `delivery_slots`) are managed on two separate admin
pages (`/admin/products`, `/admin/calendar`) with no relationship between
them. There's no way to say "the 1.5kg cut isn't offered on Aug 23" — a
product is either available everywhere, or nowhere.

Dave wants product availability manageable from the same calendar date
panel he already uses for open/closed + slot capacity, so managing "what's
available when" doesn't become two disconnected systems.

## Decisions from brainstorming

- **Granularity:** per calendar date (not per AM/PM slot). One exclusion
  list per date, shared by both slots.
- **Default:** every date offers all globally-available products. Admin
  action is opt-out (uncheck to exclude), not opt-in. This requires no
  backfill for existing dates or new products/dates going forward.
- **Precedence:** a product's global `is_available = false` (set on
  `/admin/products`) always wins. The calendar checklist only lists
  globally-available products — there's nothing to toggle for a
  globally-disabled product.

## Data model

New table, `date_product_exclusions`:

```sql
CREATE TABLE date_product_exclusions (
  delivery_date_id UUID NOT NULL REFERENCES delivery_dates(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (delivery_date_id, product_id)
);

ALTER TABLE date_product_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON date_product_exclusions
  FOR SELECT TO anon, authenticated USING (true);
```

A row means "this product is turned OFF for this date." No row for a given
date = every globally-available product is offered that day. Writes go
through the service-role client only (same pattern as every other admin
write path in this app), so no additional RLS policy is needed for writes.

## Admin: Calendar date panel

`components/admin/DateSidePanel.tsx` gains a "Products available" section,
rendered inside the `form.is_open` branch (closed dates don't need it —
nothing is orderable on a closed date regardless).

- Fetched once by `DeliveryCalendarGrid` on mount, reusing the existing
  `GET /api/admin/products` route (filtered client-side to
  `is_available === true`) and passed down as a prop — avoids a new
  endpoint and avoids re-fetching every time a date is selected.
- Checklist of `{ sku, name, weight_label }`, one checkbox per product,
  checked = available. Default state for a date with no exclusion rows:
  all checked.
- On Save, the panel sends `unavailable_product_ids: string[]` (the
  unchecked ones) alongside the existing fields, in the same POST (new
  date) / PATCH (existing date) request it already sends. One Save button,
  no new network round trip.

`app/api/admin/delivery-dates/route.ts` (`POST`) and
`app/api/admin/delivery-dates/[id]/route.ts` (`PATCH`) both accept the new
`unavailable_product_ids` field: replace the date's exclusion rows
(delete-then-insert, wrapped in the same handler) when the field is
present. `GET` (both the list route and the implicit fetch after
POST/PATCH) includes `unavailable_product_ids` in the response so the
panel can preload checkbox state.

## Storefront enforcement

Customers pick products **before** a delivery date on `/order`, so this
can't be a simple "only show what's available" filter at select-time.
Two layers:

1. **`lib/delivery/slots.ts` / `/api/delivery-slots`** — `AvailableDate`
   gains `unavailable_product_ids: string[]`. Cheap: it's normally empty.
2. **`components/order/OrderPage.tsx`** — once a date is selected, cross-
   check cart items against `selectedDateData.unavailable_product_ids`.
   If any cart item is excluded, show an inline message identifying which
   item and why ("Angus Roast Beef — 1kg isn't available on Aug 23. Remove
   it or choose a different date.") and add it to `validate()` so submit
   is blocked until resolved.
3. **`lib/orders/create.ts` (`createOrder`)** — server-side re-check,
   independent of the client. After the existing `is_available` loop,
   fetch `date_product_exclusions` for `delivery_date_id` and reject with
   the same `VALIDATION` error shape if any cart product is excluded. This
   is the actual guard — the client-side check is UX only, since admin
   could change exclusions mid-checkout.

## Out of scope

- Per-slot (AM vs PM) granularity — explicitly rejected in favor of
  per-date.
- Bulk-editing exclusions across a date range — single-date panel only,
  matching how the rest of the calendar page works today.
- Any change to `/admin/products` — it remains the source of truth for
  global availability and is untouched by this feature.

## Testing

No test framework exists in this repo (confirmed during the Products
Management work) — verification is manual, consistent with every other
admin feature here:

1. Open a date, uncheck a product, Save — confirm it persists (revisit
   the date, checkbox stays unchecked).
2. On `/order`, add the excluded product to cart, pick the excluded date
   — confirm the inline warning appears and submit is blocked.
3. Bypass the client check (e.g. direct `POST /api/orders` with the
   excluded product) — confirm the server rejects it.
4. Set a product globally unavailable on `/admin/products` — confirm it
   disappears from the calendar checklist entirely.
5. A date with no exclusions ever set — confirm all globally-available
   products are orderable (default-inclusive behavior holds).
