# Date-Based Product Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin exclude specific products from a specific delivery date via the existing Delivery Calendar panel, enforced on both the storefront and the server.

**Architecture:** A new `date_product_exclusions` join table (empty = everything available, a row = that product is OFF for that date) is read/written through the existing admin delivery-dates API and surfaced through the existing public delivery-slots API. The storefront cross-checks the cart against the selected date's exclusions client-side for UX, and `createOrder` re-checks server-side as the actual guard.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + PostgREST), TypeScript, `@supabase/supabase-js`, `@supabase/ssr`.

**Spec:** `docs/superpowers/specs/2026-08-21-date-product-availability-design.md`

## Global Constraints

- No test framework exists in this repo (confirmed during prior work this session). Every task's verification step is a **manual check** — a `curl`/REST command or a `tsc --noEmit` pass — not an automated test file. This is a deliberate, spec-approved adaptation of this plan's testing steps, not a shortcut.
- All server-side Supabase reads/writes MUST go through `createServiceClient()` (`lib/supabase/service.ts`) or `createClient()` (`lib/supabase/server.ts`). Both were fixed earlier this session to pass an explicit `cache: 'no-store'` fetch override, working around a real Next.js Data Cache bug (a `force-dynamic` route still had a stale, pre-existing cached query response served indefinitely). Do not hand-roll a separate `createClient(url, key)` call anywhere in this plan — always import the existing factory.
- Live Supabase project ref: `ckffvnlbujlcxmruzglo`. Vercel project: `lavaca-mnl-app` (scope `oshudonuts-projects`), production domain `lavaca-mnl-app.vercel.app`. Deploys: `vercel --prod --yes` from `~/lavaca-mnl-app`.
- Existing migrations: `001_initial_schema.sql`, `002_rls_policies.sql`, `003_storage_and_seed.sql` — already applied to the live DB. This plan adds `004_date_product_exclusions.sql`.
- Never hardcode the Supabase DB password or service-role key as a literal string in any file this plan creates — pull them from the environment at run time (see Task 1).

---

### Task 1: Migration — `date_product_exclusions` table

**Files:**
- Create: `supabase/migrations/004_date_product_exclusions.sql`

**Interfaces:**
- Produces: table `date_product_exclusions(delivery_date_id uuid, product_id uuid)`, composite PK, `ON DELETE CASCADE` from both parents, RLS enabled with a public `SELECT` policy (`anon_select`) matching the existing `products`/`delivery_dates` pattern. Later tasks read/write this table by name — no other interface.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/004_date_product_exclusions.sql

CREATE TABLE date_product_exclusions (
  delivery_date_id UUID NOT NULL REFERENCES delivery_dates(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (delivery_date_id, product_id)
);

ALTER TABLE date_product_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON date_product_exclusions
  FOR SELECT TO anon, authenticated USING (true);
```

- [ ] **Step 2: Apply the migration to the live database**

```bash
cd ~/lavaca-mnl-app
export SUPABASE_DB_PASSWORD=$(vercel env pull /dev/stdout --yes 2>/dev/null | grep '^POSTGRES_PASSWORD=' | cut -d'"' -f2)
supabase db push --yes
```

Expected: `Applying migration 004_date_product_exclusions.sql...` then `Finished supabase db push.`

- [ ] **Step 3: Verify the table exists and RLS is correct (manual check — no test framework)**

```bash
# Anon key should be able to SELECT (empty result, 200 — not 401/403)
ANON_KEY=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d'"' -f2)
curl -s -o /dev/null -w "anon select status: %{http_code}\n" \
  "https://ckffvnlbujlcxmruzglo.supabase.co/rest/v1/date_product_exclusions?select=*" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

# Service role should be able to INSERT and DELETE (round-trip against a real product/date)
SR_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d'"' -f2)
PRODUCT_ID=$(curl -s "https://ckffvnlbujlcxmruzglo.supabase.co/rest/v1/products?select=id&limit=1" -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
DATE_ID=$(curl -s "https://ckffvnlbujlcxmruzglo.supabase.co/rest/v1/delivery_dates?select=id&limit=1" -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")
if [ -n "$DATE_ID" ]; then
  curl -s -X POST "https://ckffvnlbujlcxmruzglo.supabase.co/rest/v1/date_product_exclusions" \
    -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" \
    -d "{\"delivery_date_id\":\"$DATE_ID\",\"product_id\":\"$PRODUCT_ID\"}"
  echo
  curl -s -X DELETE "https://ckffvnlbujlcxmruzglo.supabase.co/rest/v1/date_product_exclusions?delivery_date_id=eq.$DATE_ID&product_id=eq.$PRODUCT_ID" \
    -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" -w "\ndelete status: %{http_code}\n"
else
  echo "No delivery_dates row exists yet — skip the insert/delete check, table creation is still verified by the anon select above."
fi
```

Expected: `anon select status: 200`; if a delivery date exists, the insert returns the inserted row and delete status is `204`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_date_product_exclusions.sql
git commit -m "Add date_product_exclusions table for per-date product availability"
```

---

### Task 2: Admin delivery-dates API — read/write exclusions

**Files:**
- Modify: `app/api/admin/delivery-dates/route.ts` (`GET` at line 6, `POST` at line 37)
- Modify: `app/api/admin/delivery-dates/[id]/route.ts` (`PATCH` at line 11)

**Interfaces:**
- Consumes: `date_product_exclusions` table from Task 1.
- Produces: every response from these three handlers gains `unavailable_product_ids: string[]` (a flat array of product UUIDs, empty when nothing is excluded). Request bodies to `POST` and `PATCH` accept an optional `unavailable_product_ids: string[]` — when the field is present (including `[]`), the date's exclusion rows are replaced; when omitted, exclusions are left untouched. Task 3's frontend reads and writes this exact field name.

- [ ] **Step 1: Extend `GET` (list) in `app/api/admin/delivery-dates/route.ts`**

Replace the `.select` call through the final `return` (lines 22–34) with:

```ts
  const { data, error } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end ),
      date_product_exclusions ( product_id )
    `)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch delivery dates' }, { status: 500 })

  const rows = (data ?? []).map((row: any) => ({
    ...row,
    unavailable_product_ids: (row.date_product_exclusions ?? []).map((e: any) => e.product_id),
    date_product_exclusions: undefined,
  }))

  return NextResponse.json(rows)
```

- [ ] **Step 2: Extend `POST` in the same file to accept and persist exclusions**

In the destructure at line 47–54, add `unavailable_product_ids`:

```ts
  const {
    date,
    max_orders_total = 10,
    am_enabled = true,
    am_max = 5,
    pm_enabled = true,
    pm_max = 5,
    unavailable_product_ids,
  } = body
```

After the PM slot upsert block (after line 128, before the `// EVT-008` comment), add:

```ts
  // Sync product exclusions for this date, if provided
  if (unavailable_product_ids !== undefined) {
    await supabase.from('date_product_exclusions').delete().eq('delivery_date_id', dateId)
    if (unavailable_product_ids.length > 0) {
      await supabase.from('date_product_exclusions').insert(
        unavailable_product_ids.map((product_id: string) => ({ delivery_date_id: dateId, product_id }))
      )
    }
  }
```

Replace the final `.select` through the `return` (lines 148–157) with:

```ts
  const { data: updated } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end ),
      date_product_exclusions ( product_id )
    `)
    .eq('id', dateId)
    .single()

  const responseBody = updated
    ? {
        ...updated,
        unavailable_product_ids: ((updated as any).date_product_exclusions ?? []).map((e: any) => e.product_id),
        date_product_exclusions: undefined,
      }
    : updated

  return NextResponse.json(responseBody, { status: isNew ? 201 : 200 })
```

- [ ] **Step 3: Extend `PATCH` in `app/api/admin/delivery-dates/[id]/route.ts`**

In the destructure at lines 32–41, add `unavailable_product_ids`:

```ts
  const {
    is_open = existing.is_open,
    max_orders_total,
    closure_reason,
    closure_type,
    am_enabled,
    am_max,
    pm_enabled,
    pm_max,
    unavailable_product_ids,
  } = body
```

After the PM slot update block (after line 86, before `const wasOpen = existing.is_open`), add:

```ts
  // Sync product exclusions for this date, if provided
  if (unavailable_product_ids !== undefined) {
    await supabase.from('date_product_exclusions').delete().eq('delivery_date_id', params.id)
    if (unavailable_product_ids.length > 0) {
      await supabase.from('date_product_exclusions').insert(
        unavailable_product_ids.map((product_id: string) => ({ delivery_date_id: params.id, product_id }))
      )
    }
  }
```

Replace the final `.select` through the `return` (lines 131–140) with:

```ts
  const { data: updated } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end ),
      date_product_exclusions ( product_id )
    `)
    .eq('id', params.id)
    .single()

  const responseBody = updated
    ? {
        ...updated,
        unavailable_product_ids: ((updated as any).date_product_exclusions ?? []).map((e: any) => e.product_id),
        date_product_exclusions: undefined,
      }
    : updated

  return NextResponse.json(responseBody)
```

- [ ] **Step 4: Typecheck**

```bash
cd ~/lavaca-mnl-app && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 5: Manual verification against the live DB (no test framework)**

Sign in as admin and exercise the endpoints directly (reuses the admin session cookie pattern from earlier debugging this session — sign in via Supabase password grant, build the `sb-<ref>-auth-token` cookie, `curl` the routes):

```bash
cd ~/lavaca-mnl-app
ANON_KEY=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d'"' -f2)
curl -s -X POST "https://ckffvnlbujlcxmruzglo.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"deejcardona@gmail.com","password":"<current admin password>"}' > /tmp/session.json
python3 -c "
import json, base64, urllib.parse
d = json.load(open('/tmp/session.json'))
session = {'access_token': d['access_token'], 'token_type': d.get('token_type','bearer'), 'expires_in': d.get('expires_in',3600), 'expires_at': d.get('expires_at'), 'refresh_token': d['refresh_token'], 'user': d['user']}
raw = json.dumps(session, separators=(',',':')).encode()
print(urllib.parse.quote('base64-' + base64.b64encode(raw).decode(), safe=''))
" > /tmp/cookie.txt
COOKIE=$(cat /tmp/cookie.txt)

# List a month, confirm unavailable_product_ids is present (empty array) on every date
curl -s -b "sb-ckffvnlbujlcxmruzglo-auth-token=$COOKIE" \
  "https://lavaca-mnl-app.vercel.app/api/admin/delivery-dates?month=$(date +%Y-%m)" | python3 -m json.tool | grep -A1 unavailable_product_ids | head -10
```

Expected: each date object includes `"unavailable_product_ids": []`. (PATCH round-trip with a real exclusion is exercised end-to-end in Task 3's verification, once the UI can drive it.)

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/delivery-dates/route.ts "app/api/admin/delivery-dates/[id]/route.ts"
git commit -m "Read/write per-date product exclusions in admin delivery-dates API"
```

---

### Task 3: Admin Calendar UI — products checklist

**Files:**
- Modify: `components/admin/DeliveryCalendarGrid.tsx`
- Modify: `components/admin/DateSidePanel.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/products` (existing route, returns `{ id, sku, name, description, price, weight_label, image_url, is_available, sort_order }[]`); `unavailable_product_ids: string[]` field from Task 2's API responses.
- Produces: `DateSidePanel` sends `unavailable_product_ids: string[]` in its `POST`/`PATCH` request bodies when the date is open. No new exports beyond the existing `AdminDateRecord` type gaining one field.

- [ ] **Step 1: Fetch globally-available products once in `DeliveryCalendarGrid.tsx`**

Add state near the other `useState` calls (after line 174, `const [isMobile, setIsMobile] = useState(false)`):

```ts
  const [products, setProducts] = useState<{ id: string; sku: string; name: string; weight_label: string }[]>([])
```

Add a fetch effect near the existing `useEffect` for `isMobile` (after that block, before `const fetchDates = useCallback(...)`):

```ts
  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((all: Array<{ id: string; sku: string; name: string; weight_label: string; is_available: boolean }>) => {
        setProducts(all.filter((p) => p.is_available).map(({ id, sku, name, weight_label }) => ({ id, sku, name, weight_label })))
      })
      .catch((err) => console.error('[DeliveryCalendarGrid] products fetch error:', err))
  }, [])
```

Pass `products={products}` to both `<DateSidePanel ... />` render sites (desktop, around line 411, and mobile, around line 422).

- [ ] **Step 2: Extend `AdminDateRecord` and `Props` in `DateSidePanel.tsx`**

In the `AdminDateRecord` interface (lines 15–24), add one field:

```ts
export interface AdminDateRecord {
  id: string
  date: string
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  cal_availability_event_id: string | null
  unavailable_product_ids: string[]
  delivery_slots: DateSlot[]
}
```

Extend `Props` (lines 26–32) with the products list:

```ts
interface Props {
  date: string
  record: AdminDateRecord | null
  products: { id: string; sku: string; name: string; weight_label: string }[]
  onClose: () => void
  onSaved: (updated: AdminDateRecord) => void
  isMobileOverlay?: boolean
}
```

Update the component signature (line 83) to destructure `products`:

```ts
export function DateSidePanel({ date, record, products, onClose, onSaved, isMobileOverlay }: Props) {
```

- [ ] **Step 3: Add excluded-products state to `FormState`**

Extend `FormState` (lines 34–43) with one field:

```ts
interface FormState {
  is_open: boolean
  max_orders_total: string
  am_enabled: boolean
  am_max: string
  pm_enabled: boolean
  pm_max: string
  closure_reason: string
  closure_type: 'operational' | 'holiday' | 'vacation'
  excluded_product_ids: Set<string>
}
```

Update `defaultForm` (lines 45–73) to populate it in both branches:

```ts
function defaultForm(record: AdminDateRecord | null): FormState {
  if (!record) {
    return {
      is_open: true,
      max_orders_total: '10',
      am_enabled: true,
      am_max: '5',
      pm_enabled: true,
      pm_max: '5',
      closure_reason: '',
      closure_type: 'operational',
      excluded_product_ids: new Set(),
    }
  }

  const slots = record.delivery_slots ?? []
  const am = slots.find(s => s.slot_window === 'AM')
  const pm = slots.find(s => s.slot_window === 'PM')

  return {
    is_open: record.is_open,
    max_orders_total: String(record.max_orders_total ?? 10),
    am_enabled: am?.is_open ?? true,
    am_max: String(am?.max_orders ?? 5),
    pm_enabled: pm?.is_open ?? true,
    pm_max: String(pm?.max_orders ?? 5),
    closure_reason: record.closure_reason ?? '',
    closure_type: (record.closure_type as FormState['closure_type']) ?? 'operational',
    excluded_product_ids: new Set(record.unavailable_product_ids ?? []),
  }
}
```

- [ ] **Step 4: Send `unavailable_product_ids` in `handleSave`**

In `handleSave` (lines 99–152), add the field to both request bodies, only while the date is open. Replace the `if (!record) { ... } else { ... }` block (lines 108–138):

```ts
      let res: Response
      if (!record) {
        res = await fetch('/api/admin/delivery-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            is_open: form.is_open,
            max_orders_total: totalMax,
            am_enabled: form.am_enabled,
            am_max: amMax,
            pm_enabled: form.pm_enabled,
            pm_max: pmMax,
            ...(form.is_open ? { unavailable_product_ids: Array.from(form.excluded_product_ids) } : {}),
          }),
        })
      } else {
        res = await fetch(`/api/admin/delivery-dates/${record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_open: form.is_open,
            max_orders_total: totalMax,
            am_enabled: form.am_enabled,
            am_max: amMax,
            pm_enabled: form.pm_enabled,
            pm_max: pmMax,
            closure_reason: form.closure_reason || null,
            closure_type: form.closure_type,
            ...(form.is_open ? { unavailable_product_ids: Array.from(form.excluded_product_ids) } : {}),
          }),
        })
      }
```

- [ ] **Step 5: Render the checklist**

Add this block inside the `form.is_open ? (<>...</>) : (...)` branch (lines 290–338), immediately after the `PM slot` `<SlotSection ... />` and before the closing `</>`:

```tsx
            {/* Products available */}
            <div>
              <label style={labelStyle}>Products available</label>
              {products.length === 0 ? (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8C7B6B', margin: 0 }}>
                  No available products to list.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.map((p) => {
                    const checked = !form.excluded_product_ids.has(p.id)
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 13,
                          color: '#1C1917',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(form.excluded_product_ids)
                            checked ? next.add(p.id) : next.delete(p.id)
                            set('excluded_product_ids', next)
                          }}
                          style={{ accentColor: '#A16207' }}
                        />
                        {p.name} — {p.weight_label}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
```

- [ ] **Step 6: Typecheck**

```bash
cd ~/lavaca-mnl-app && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Deploy and verify end-to-end in the browser (no test framework)**

```bash
cd ~/lavaca-mnl-app && vercel --prod --yes
```

Then in a browser at `https://lavaca-mnl-app.vercel.app/admin/calendar`: open a date, uncheck one product, click Save, close and reopen the same date — confirm the unchecked product is still unchecked. This is the manual acceptance check for this task; Task 1's spec item "Open a date, uncheck a product, Save — confirm it persists" is satisfied here.

- [ ] **Step 8: Commit**

```bash
git add components/admin/DeliveryCalendarGrid.tsx components/admin/DateSidePanel.tsx
git commit -m "Add per-date product availability checklist to admin calendar"
```

---

### Task 4: Expose exclusions to the storefront

**Files:**
- Modify: `lib/delivery/slots.ts`

**Interfaces:**
- Consumes: `date_product_exclusions` table (Task 1).
- Produces: `AvailableDate` (exported type) gains `unavailable_product_ids: string[]`. Task 5 (`OrderPage.tsx`) and the existing `/api/delivery-slots` route (unchanged, just passes through `getAvailableSlots`'s return value) both rely on this field name.

- [ ] **Step 1: Extend the `AvailableDate` type**

In the type definition (lines 17–25), add the field:

```ts
export type AvailableDate = {
  id: string
  date: string           // "YYYY-MM-DD"
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  slots: SlotWindow[]
  unavailable_product_ids: string[]
}
```

- [ ] **Step 2: Extend the query and raw row type**

In the `.select` call (lines 95–113), add the nested embed:

```ts
  const { data: rows, error: datesError } = await supabase
    .from('delivery_dates')
    .select(
      `
      id,
      date,
      is_open,
      max_orders_total,
      closure_reason,
      closure_type,
      delivery_slots (
        id,
        slot_window,
        window_start,
        window_end,
        max_orders,
        booked_count,
        is_open
      ),
      date_product_exclusions (
        product_id
      )
    `
    )
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })
```

Extend `RawDateRow` (lines 125–141):

```ts
  type RawDateRow = {
    id: string
    date: string
    is_open: boolean
    max_orders_total: number
    closure_reason: string | null
    closure_type: string | null
    delivery_slots: Array<{
      id: string
      slot_window: 'AM' | 'PM'
      window_start: string
      window_end: string
      max_orders: number
      booked_count: number
      is_open: boolean
    }>
    date_product_exclusions: Array<{ product_id: string }>
  }
```

- [ ] **Step 3: Populate the field in the transform loop**

In the loop body (lines 145–185), update the destructure and the pushed object:

```ts
  for (const rawRow of (rows ?? []) as RawDateRow[]) {
    const { id, date, is_open, max_orders_total, closure_reason, closure_type, delivery_slots, date_product_exclusions } =
      rawRow

    // BR-ORD-04: Skip Mondays entirely (getDay() === 1)
    // Use +08:00 (PST) so day-of-week is correct regardless of server timezone
    const dayOfWeek = new Date(`${date}T00:00:00+08:00`).getDay()
    if (dayOfWeek === 1) continue

    // Build slot list
    const slots: SlotWindow[] = (delivery_slots ?? [])
      .sort((a, b) => (a.slot_window < b.slot_window ? -1 : 1))
      .map((s) => {
        // BR-ORD-01: 48hr advance booking rule
        // Explicit +08:00 offset (PST) so cutoff is correct on UTC servers
        const slotStart = new Date(`${date}T${s.window_start}+08:00`)
        const withinCutoff = slotStart < cutoff

        const remaining = Math.max(0, s.max_orders - s.booked_count)

        return {
          window: s.slot_window,
          window_start: s.window_start,
          window_end: s.window_end,
          max_orders: s.max_orders,
          remaining,
          // Mark closed if within 48hr cutoff; preserve DB open/closed otherwise
          is_open: withinCutoff ? false : s.is_open,
        }
      })

    dates.push({
      id,
      date,
      is_open,
      max_orders_total,
      closure_reason,
      closure_type,
      slots,
      unavailable_product_ids: (date_product_exclusions ?? []).map((e) => e.product_id),
    })
  }
```

- [ ] **Step 4: Typecheck**

```bash
cd ~/lavaca-mnl-app && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Manual verification (no test framework)**

```bash
curl -s "https://lavaca-mnl-app.vercel.app/api/delivery-slots" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('dates:', len(d['dates']))
print('sample unavailable_product_ids field present:', 'unavailable_product_ids' in d['dates'][0])
"
```

Expected: `unavailable_product_ids field present: True`. Note `/api/delivery-slots` has `export const revalidate = 60` (a 60s cache) — same staleness tolerance the route already has for slot capacity, so this is expected, not a regression.

- [ ] **Step 6: Commit**

```bash
git add lib/delivery/slots.ts
git commit -m "Expose per-date product exclusions in the public delivery-slots API"
```

---

### Task 5: Storefront cart/date conflict warning

**Files:**
- Modify: `components/order/OrderPage.tsx`

**Interfaces:**
- Consumes: `AvailableDate.unavailable_product_ids` (Task 4); `CartItem` type from `components/order/ProductSelector.tsx` (`{ product_id: string; quantity: number; unit_price: number }`); `Product` type (`{ id, sku, name, description, price, weight_label, image_url }`), already available via the `products` prop.
- Produces: `validate()` blocks submission when a conflict exists; nothing downstream depends on new exports.

- [ ] **Step 1: Compute the conflict list**

Add this right after `const selectedDateData = ...` (line 77):

```ts
  const excludedCartProducts = selectedDateData
    ? cart
        .filter((item) => selectedDateData.unavailable_product_ids.includes(item.product_id))
        .map((item) => products.find((p) => p.id === item.product_id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : []
```

- [ ] **Step 2: Block submission in `validate()`**

In `validate()` (lines 79–89), add a check after the existing date check:

```ts
  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!cart.length) errors.cart = 'Please add at least one item.'
    if (!selectedDate) errors.date = 'Please select a delivery date.'
    if (excludedCartProducts.length > 0) {
      errors.date = `${excludedCartProducts.map((p) => `${p.name} (${p.weight_label})`).join(', ')} ${excludedCartProducts.length > 1 ? 'are' : 'is'} not available on the selected date.`
    }
    if (!selectedWindow) errors.window = 'Please select a delivery time.'
    if (!customer.name.trim()) errors.name = 'Full name is required.'
    if (!customer.phone.trim()) errors.phone = 'Phone number is required.'
    if (!customer.email.trim()) errors.email = 'Email address is required.'
    if (!customer.delivery_address.trim()) errors.delivery_address = 'Delivery address is required.'
    return errors
  }
```

(This reuses the `date` error key and its existing `{formErrors.date && <p style={fieldErrorStyle}>{formErrors.date}</p>}` render right after the calendar, so no new JSX render block is needed — the existing error slot just gets a more specific message when there's a conflict.)

- [ ] **Step 3: Add a live (pre-submit) inline warning**

Users should see the conflict as soon as they pick a conflicting date, not just after clicking submit. In the "Calendar / Closure Banner" section (lines 206–228), add this right after the `<AvailabilityCalendar ... />` element and before the existing `{formErrors.date && ...}` line:

```tsx
                {excludedCartProducts.length > 0 && (
                  <p style={fieldErrorStyle}>
                    {excludedCartProducts.map((p) => `${p.name} (${p.weight_label})`).join(', ')}{' '}
                    {excludedCartProducts.length > 1 ? 'are' : 'is'} not available on this date. Remove{' '}
                    {excludedCartProducts.length > 1 ? 'them' : 'it'} or choose a different date.
                  </p>
                )}
```

- [ ] **Step 4: Typecheck**

```bash
cd ~/lavaca-mnl-app && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add components/order/OrderPage.tsx
git commit -m "Warn and block checkout when cart items are excluded on the selected date"
```

---

### Task 6: Server-side enforcement in `createOrder`

**Files:**
- Modify: `lib/orders/create.ts`

**Interfaces:**
- Consumes: `date_product_exclusions` table (Task 1); existing `products` array already fetched in `createOrder` (line 100).
- Produces: `createOrder` returns `{ error: { code: 'VALIDATION', message } }` when a cart item is excluded for the given date — same `CreateOrderError` shape already used by the `is_available` check right above it, so `app/api/orders/route.ts` needs no changes.

- [ ] **Step 1: Add the exclusion check**

Insert this block right after the existing `is_available` loop (after line 119, before the `// Atomically increment booked_count` comment at line 121):

```ts
  // -------------------------------------------------------------------------
  // Reject cart items excluded for this specific delivery date
  // -------------------------------------------------------------------------
  const { data: exclusions } = await supabase
    .from('date_product_exclusions')
    .select('product_id')
    .eq('delivery_date_id', delivery_date_id)

  const excludedIds = new Set((exclusions ?? []).map((e) => e.product_id))
  for (const item of cart) {
    if (excludedIds.has(item.product_id)) {
      const product = products.find((p) => p.id === item.product_id)
      return {
        error: {
          code: 'VALIDATION',
          message: `${product?.name ?? 'One of your items'} is not available for this delivery date.`,
        },
      }
    }
  }
```

- [ ] **Step 2: Typecheck**

```bash
cd ~/lavaca-mnl-app && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Manual verification against the live API (no test framework)**

This must run *after* Task 3 is deployed, so there's a real exclusion to test against. Exclude one product for a real open date via the admin UI, then attempt to order it directly against the API (bypassing the client-side warning) to prove the server is the actual guard:

```bash
# <DATE_ID> and <EXCLUDED_PRODUCT_ID> come from a date you excluded via /admin/calendar
curl -s -X POST "https://lavaca-mnl-app.vercel.app/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_date_id": "<DATE_ID>",
    "slot_window": "AM",
    "cart": [{"product_id": "<EXCLUDED_PRODUCT_ID>", "quantity": 1}],
    "customer": {"name":"Test","phone":"09170000000","email":"test@example.com","delivery_address":"Test address","payment_method":"gcash"}
  }' -w "\nstatus: %{http_code}\n"
```

Expected: `status: 422` (or the status `app/api/orders/route.ts` maps `VALIDATION` errors to) with a message naming the excluded product — confirming the request was rejected before any slot was reserved or order row created.

- [ ] **Step 4: Commit**

```bash
git add lib/orders/create.ts
git commit -m "Reject orders containing products excluded for the delivery date server-side"
```

---

### Task 7: Full deploy and end-to-end verification

**Files:** none (deployment + verification only).

**Interfaces:** none — this task exercises everything Tasks 1–6 produced together.

- [ ] **Step 1: Final typecheck and build**

```bash
cd ~/lavaca-mnl-app
npx tsc --noEmit
npm run build
```

Expected: both clean. (If the build fails on `RESEND_API_KEY`/local-env-only issues, that's the same known local-only `.env.local` gap noted earlier this session — deploy via `vercel --prod` instead, which builds with real Production env vars, and treat that deploy's success as the build gate.)

- [ ] **Step 2: Deploy**

```bash
vercel --prod --yes
```

- [ ] **Step 3: Walk the spec's testing checklist (all five items, from `docs/superpowers/specs/2026-08-21-date-product-availability-design.md`)**

1. Open a date, uncheck a product, Save — revisit the date, confirm it's still unchecked. *(Already covered in Task 3, Step 7 — re-confirm on this final deploy.)*
2. On `/order`, add the excluded product to cart, pick the excluded date — confirm the inline warning appears and submit is blocked.
3. Bypass the client check via direct `POST /api/orders` with the excluded product — confirm the server rejects it. *(Already covered in Task 6, Step 3 — re-confirm on this final deploy.)*
4. Set a product globally unavailable on `/admin/products` — confirm it disappears from the calendar checklist entirely (this falls out of Task 3 Step 1's `is_available` filter — verify by toggling a product off and reloading `/admin/calendar`).
5. A date with no exclusions ever set — confirm all globally-available products are still orderable on `/order` (default-inclusive behavior holds).

- [ ] **Step 4: Update the spec status**

Edit `docs/superpowers/specs/2026-08-21-date-product-availability-design.md`, change the header:

```markdown
**Status:** Implemented
```

```bash
git add docs/superpowers/specs/2026-08-21-date-product-availability-design.md
git commit -m "Mark date-based product availability spec as implemented"
git push origin main
```
