import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PICKUP_TIMES } from '@/lib/delivery/pickup'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvailableDate = {
  id: string
  date: string           // "YYYY-MM-DD"
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  pickup_times: string[]   // "HH:MM" times still bookable (later than now)
  unavailable_product_ids: string[]
}

export type SlotsResponse = {
  closure_active: boolean
  closure_message: string | null
  closed_from: string | null
  closed_until: string | null
  dates: AvailableDate[]
}

// ---------------------------------------------------------------------------
// Internal DB row shapes (raw query results)
// ---------------------------------------------------------------------------

type AnnouncementRow = {
  is_active: boolean
  message: string | null
  closed_from: string | null
  closed_until: string | null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Returns pickup dates and bookable pickup times between fromDate and toDate (inclusive).
 *
 * Business rules enforced:
 *   BR-ORD-01 — same-day booking allowed; only pickup times later than now
 *
 * If a sitewide closure announcement is active, returns early with
 * closure_active: true and an empty dates array.
 */
export async function getAvailableSlots(
  fromDate: string,   // "YYYY-MM-DD"
  toDate: string,     // "YYYY-MM-DD"
  useServiceClient = false
): Promise<SlotsResponse> {
  const supabase = useServiceClient ? createServiceClient() : createClient()

  // -------------------------------------------------------------------------
  // Step 1: Check for active sitewide closure announcement
  // -------------------------------------------------------------------------
  const { data: announcement, error: announcementError } = await supabase
    .from('business_announcements')
    .select('is_active, message, closed_from, closed_until')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (announcementError) throw announcementError

  if (announcement) {
    const row = announcement as AnnouncementRow
    return {
      closure_active: true,
      closure_message: row.message ?? null,
      closed_from: row.closed_from ?? null,
      closed_until: row.closed_until ?? null,
      dates: [],
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Query delivery dates with their per-date product exclusions
  // -------------------------------------------------------------------------
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
      date_product_exclusions (
        product_id
      )
    `
    )
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })

  if (datesError) throw datesError

  // -------------------------------------------------------------------------
  // Step 3: Transform and apply business rules
  // -------------------------------------------------------------------------
  const now = new Date()

  type RawDateRow = {
    id: string
    date: string
    is_open: boolean
    max_orders_total: number
    closure_reason: string | null
    closure_type: string | null
    date_product_exclusions: Array<{ product_id: string }>
  }

  const dates: AvailableDate[] = []

  for (const rawRow of (rows ?? []) as RawDateRow[]) {
    const {
      id,
      date,
      is_open,
      max_orders_total,
      closure_reason,
      closure_type,
      date_product_exclusions,
    } = rawRow

    // BR-ORD-01: only pickup times that haven't passed yet.
    // Explicit +08:00 offset (PST) so the comparison is correct on UTC servers
    const pickup_times = PICKUP_TIMES.filter(
      (t) => new Date(`${date}T${t}:00+08:00`) > now
    )

    dates.push({
      id,
      date,
      is_open,
      max_orders_total,
      closure_reason,
      closure_type,
      pickup_times,
      unavailable_product_ids: (date_product_exclusions ?? []).map((e) => e.product_id),
    })
  }

  return {
    closure_active: false,
    closure_message: null,
    closed_from: null,
    closed_until: null,
    dates,
  }
}
