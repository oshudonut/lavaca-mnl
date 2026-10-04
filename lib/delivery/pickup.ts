// Pickup times offered to customers: on the hour, 9:00 AM through 6:00 PM.
export const PICKUP_TIMES = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
] as const

// Labels for orders placed before the switch to pickup (AM/PM delivery slots).
const LEGACY_WINDOW_LABELS: Record<string, string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

export function isPickupTime(value: unknown): value is string {
  return typeof value === 'string' && (PICKUP_TIMES as readonly string[]).includes(value)
}

/** "13:00" or "13:00:00" -> "1:00 PM" */
export function formatPickupTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Time label for any order: its pickup time, or the legacy delivery window. */
export function orderTimeLabel(order: { pickup_time?: string | null; slot_window?: string | null }): string {
  if (order.pickup_time) return formatPickupTime(order.pickup_time)
  if (order.slot_window) return LEGACY_WINDOW_LABELS[order.slot_window] ?? order.slot_window
  return '—'
}
