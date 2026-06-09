import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SlotWindow = {
  window: 'AM' | 'PM'
  window_start: string   // "09:00"
  window_end: string     // "12:00"
  max_orders: number
  remaining: number
  is_open: boolean
}

export type AvailableDate = {
  id: string
  date: string           // "YYYY-MM-DD"
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  slots: SlotWindow[]
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

type DeliveryDateSlotRow = {
  id: string
  date: string
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  slot_id: string | null
  slot_window: 'AM' | 'PM' | null
  window_start: string | null
  window_end: string | null
  max_orders: number | null
  booked_count: number | null
  slot_is_open: boolean | null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Returns available delivery slots between fromDate and toDate (inclusive).
 *
 * Business rules enforced:
 *   BR-ORD-01 — 48hr advance booking cutoff applied server-side
 *   BR-ORD-04 — Mondays excluded from output entirely
 *
 * If a sitewide closure announcement is active, returns early with
 * closure_active: true and an empty dates array.
 */
export async function getAvailableSlots(
  fromDate: string,   // "YYYY-MM-DD"
  toDate: string      // "YYYY-MM-DD"
): Promise<SlotsResponse> {
  const supabase = createClient()

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
  // Step 2: Query delivery dates joined with their slots
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
      delivery_slots (
        id,
        slot_window,
        window_start,
        window_end,
        max_orders,
        booked_count,
        is_open
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
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000)

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
  }

  const dates: AvailableDate[] = []

  for (const rawRow of (rows ?? []) as RawDateRow[]) {
    const { id, date, is_open, max_orders_total, closure_reason, closure_type, delivery_slots } =
      rawRow

    // BR-ORD-04: Skip Mondays entirely (getDay() === 1)
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
    if (dayOfWeek === 1) continue

    // Build slot list
    const slots: SlotWindow[] = (delivery_slots ?? [])
      .sort((a, b) => (a.slot_window < b.slot_window ? -1 : 1))
      .map((s) => {
        // BR-ORD-01: 48hr advance booking rule
        const slotStart = new Date(`${date}T${s.window_start}`)
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
