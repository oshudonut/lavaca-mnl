import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/service'

// ---------------------------------------------------------------------------
// Color constants (Google Calendar colorId values)
// ---------------------------------------------------------------------------
const COLOR_IDS = {
  ORDER:     '2',  // Sage    — confirmed delivery orders
  AVAILABLE: '7',  // Peacock — open delivery dates
  CLOSURE:   '4',  // Flamingo — holiday / vacation closures
} as const

// ---------------------------------------------------------------------------
// Auth + client factory
// ---------------------------------------------------------------------------
function getCalendarClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set')
  const key = JSON.parse(keyJson)

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

function calendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID
  if (!id) throw new Error('GOOGLE_CALENDAR_ID is not set')
  return id
}

// ---------------------------------------------------------------------------
// Failure logging — errors are recorded in system_events, never thrown
// ---------------------------------------------------------------------------
async function logFailure(fnName: string, error: unknown, orderId?: string): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('system_events').insert({
      order_id: orderId ?? null,
      event_name: 'GCAL_SYNC_FAILED',
      triggered_by: 'system',
      payload: { function: fnName, error: String(error) },
      occurred_at: new Date().toISOString(),
    })
  } catch (logErr) {
    console.error('[calendar] failed to log GCal failure:', logErr)
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface OrderEventInput {
  order_number: string
  customer_name: string
  delivery_date: string   // YYYY-MM-DD
  window_start: string    // HH:MM
  window_end: string      // HH:MM
}

// ---------------------------------------------------------------------------
// EVT-003: create delivery order event on Google Calendar
// Returns the created event ID, or null on failure (never throws).
// ---------------------------------------------------------------------------
export async function createOrderEvent(input: OrderEventInput): Promise<string | null> {
  try {
    const cal = getCalendarClient()
    const { data } = await cal.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: `Lavaca MNL Delivery — ${input.order_number} — ${input.customer_name}`,
        colorId: COLOR_IDS.ORDER,
        start: {
          dateTime: `${input.delivery_date}T${input.window_start}:00+08:00`,
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: `${input.delivery_date}T${input.window_end}:00+08:00`,
          timeZone: 'Asia/Manila',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 240 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    })
    return data.id ?? null
  } catch (err) {
    console.error('[calendar] createOrderEvent failed:', err)
    await logFailure('createOrderEvent', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Delete any calendar event by ID (used for order cancellation + date closure)
// Never throws.
// ---------------------------------------------------------------------------
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const cal = getCalendarClient()
    await cal.events.delete({ calendarId: calendarId(), eventId })
  } catch (err) {
    console.error('[calendar] deleteCalendarEvent failed:', err)
    await logFailure('deleteCalendarEvent', err)
  }
}

// ---------------------------------------------------------------------------
// EVT-008: create all-day availability marker when a delivery date is opened
// Returns the new event ID, or null on failure.
// ---------------------------------------------------------------------------
export async function createAvailabilityBlock(date: string): Promise<string | null> {
  try {
    const cal = getCalendarClient()
    const { data } = await cal.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: 'Lavaca MNL — Deliveries Open',
        colorId: COLOR_IDS.AVAILABLE,
        start: { date },
        end: { date },
      },
    })
    return data.id ?? null
  } catch (err) {
    console.error('[calendar] createAvailabilityBlock failed:', err)
    await logFailure('createAvailabilityBlock', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// EVT-008: patch an existing availability block (e.g. date already has event)
// Never throws.
// ---------------------------------------------------------------------------
export async function patchAvailabilityBlock(eventId: string, date: string): Promise<void> {
  try {
    const cal = getCalendarClient()
    await cal.events.patch({
      calendarId: calendarId(),
      eventId,
      requestBody: {
        summary: 'Lavaca MNL — Deliveries Open',
        colorId: COLOR_IDS.AVAILABLE,
        start: { date },
        end: { date },
      },
    })
  } catch (err) {
    console.error('[calendar] patchAvailabilityBlock failed:', err)
    await logFailure('patchAvailabilityBlock', err)
  }
}

// deleteAvailabilityBlock is an alias — same operation as deleteCalendarEvent,
// but named separately for clarity at call sites.
export const deleteAvailabilityBlock = deleteCalendarEvent

// ---------------------------------------------------------------------------
// EVT-009: create all-day closure block for holiday / vacation closure types
// Returns the new event ID, or null on failure.
// ---------------------------------------------------------------------------
export async function createClosureBlock(
  date: string,
  closureType: 'holiday' | 'vacation' | string
): Promise<string | null> {
  try {
    const cal = getCalendarClient()
    const label = closureType === 'holiday' ? 'Holiday' : 'Vacation'
    const { data } = await cal.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: `Lavaca MNL — Closed (${label})`,
        colorId: COLOR_IDS.CLOSURE,
        start: { date },
        end: { date },
      },
    })
    return data.id ?? null
  } catch (err) {
    console.error('[calendar] createClosureBlock failed:', err)
    await logFailure('createClosureBlock', err)
    return null
  }
}
